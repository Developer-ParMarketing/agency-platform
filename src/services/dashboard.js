import { ROLES } from "@/lib/constants";
import { startOfTodayIST, startOfWeekIST, addDays } from "@/lib/dates";
import { toTaskDTO, toAssetDTO } from "@/lib/serializers";
import { assetFilterFor } from "@/services/access";
import { findTasksWithRefs, taskPermissions } from "@/services/tasks";
import { findAssetsWithRefs, assetPermissions } from "@/services/assets";
import Task from "@/models/Task";
import TaskUpdate from "@/models/TaskUpdate";
import Asset from "@/models/Asset";
import Project from "@/models/Project";
import Client from "@/models/Client";
import User from "@/models/User";

const OPEN = { $ne: "done" };

function byDueDate(a, b) {
    const x = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const y = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return x - y;
}

export async function buildDashboard(me) {
    const today = startOfTodayIST();
    const weekStart = startOfWeekIST();
    const weekEnd = addDays(today, 7);
    const isOverdue = (t) => t.dueDate && t.dueDate < today;

    // ---------- Everyone: my own work ----------
    const [myOpen, myAssetsToFix] = await Promise.all([
        findTasksWithRefs({ assignedTo: me.id, status: OPEN }, 300),
        findAssetsWithRefs({ uploadedBy: me.id, isArchived: false, status: { $in: ["changes_requested", "rejected"] } }, 20),
    ]);

    const result = {
        my: {
            stats: {
                open: myOpen.length,
                overdue: myOpen.filter(isOverdue).length,
                dueThisWeek: myOpen.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate < weekEnd).length,
                inReview: myOpen.filter((t) => t.status === "in_review").length,
            },
            tasks: [...myOpen].sort(byDueDate).slice(0, 8).map((t) => toTaskDTO(t, taskPermissions(me, t))),
            assetsToFix: myAssetsToFix.map((a) => toAssetDTO(a, assetPermissions(me, a))),
        },
    };

    if (me.role === ROLES.MEMBER) return result;

    // ---------- Managers & admins: review queue ----------
    const pending = await findAssetsWithRefs(
        { $and: [await assetFilterFor(me), { isArchived: false, status: { $in: ["pending_manager", "pending_admin"] } }] },
        300
    );
    const queue = pending.filter((a) => assetPermissions(me, a).canReview);
    result.reviewQueue = {
        count: queue.length,
        items: queue.slice(0, 6).map((a) => toAssetDTO(a, assetPermissions(me, a))),
    };

    // ---------- Managers & admins: team workload ----------
    const peopleFilter =
        me.role === ROLES.ADMIN
            ? { isActive: true, role: { $ne: ROLES.ADMIN } }
            : { isActive: true, _id: { $ne: me.id }, $or: [{ manager: me.id }, ...(me.team ? [{ team: me.team }] : [])] };

    const people = await User.find(peopleFilter, "name designation team").populate("team", "name").sort({ name: 1 }).lean();
    const ids = people.map((p) => p._id);

    const [openRows, hourRows, doneRows] = await Promise.all([
        Task.aggregate([
            { $match: { assignedTo: { $in: ids }, status: OPEN } },
            {
                $group: {
                    _id: "$assignedTo",
                    open: { $sum: 1 },
                    overdue: { $sum: { $cond: [{ $and: [{ $ne: ["$dueDate", null] }, { $lt: ["$dueDate", today] }] }, 1, 0] } },
                },
            },
        ]),
        TaskUpdate.aggregate([
            { $match: { user: { $in: ids }, createdAt: { $gte: weekStart } } },
            { $group: { _id: "$user", hours: { $sum: "$hoursSpent" } } },
        ]),
        Task.aggregate([
            { $match: { assignedTo: { $in: ids }, status: "done", completedAt: { $gte: weekStart } } },
            { $group: { _id: "$assignedTo", done: { $sum: 1 } } },
        ]),
    ]);

    const toMap = (rows) => new Map(rows.map((r) => [r._id.toString(), r]));
    const openMap = toMap(openRows), hourMap = toMap(hourRows), doneMap = toMap(doneRows);

    const members = people
        .map((p) => {
            const id = p._id.toString();
            return {
                id,
                name: p.name,
                designation: p.designation || "",
                team: p.team?.name || "—",
                open: openMap.get(id)?.open || 0,
                overdue: openMap.get(id)?.overdue || 0,
                doneThisWeek: doneMap.get(id)?.done || 0,
                hoursThisWeek: Math.round((hourMap.get(id)?.hours || 0) * 10) / 10,
            };
        })
        .sort((a, b) => b.overdue - a.overdue || b.open - a.open);

    result.team = {
        members,
        totals: {
            open: members.reduce((s, m) => s + m.open, 0),
            overdue: members.reduce((s, m) => s + m.overdue, 0),
            doneThisWeek: members.reduce((s, m) => s + m.doneThisWeek, 0),
        },
    };

    if (me.role !== ROLES.ADMIN) return result;

    // ---------- Admin: company ----------
    const [activeProjects, openTasks, overdueTasks, pendingApprovals, activeClients, riskRows] = await Promise.all([
        Project.countDocuments({ status: "active", isArchived: false }),
        Task.countDocuments({ status: OPEN }),
        Task.countDocuments({ status: OPEN, dueDate: { $lt: today } }),
        Asset.countDocuments({ isArchived: false, status: { $in: ["pending_manager", "pending_admin"] } }),
        Client.countDocuments({ status: "active", isArchived: false }),
        Task.aggregate([
            { $match: { status: OPEN, dueDate: { $lt: today } } },
            { $group: { _id: "$project", overdue: { $sum: 1 } } },
            { $sort: { overdue: -1 } },
            { $limit: 5 },
        ]),
    ]);

    const riskProjects = await Project.find({ _id: { $in: riskRows.map((r) => r._id) } }, "name dueDate").lean();
    const riskMap = new Map(riskProjects.map((p) => [p._id.toString(), p]));

    result.company = {
        stats: { activeProjects, openTasks, overdueTasks, pendingApprovals, activeClients },
        atRisk: riskRows
            .filter((r) => riskMap.has(r._id.toString()))
            .map((r) => {
                const p = riskMap.get(r._id.toString());
                return { id: p._id.toString(), name: p.name, overdue: r.overdue, dueDate: p.dueDate };
            }),
    };

    return result;
}