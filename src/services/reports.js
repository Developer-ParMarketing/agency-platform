import { HttpError } from "@/lib/auth-helpers";
import { ROLES, STATUS_LABELS } from "@/lib/constants";
import { startOfTodayIST } from "@/lib/dates";
import Task from "@/models/Task";
import TaskUpdate from "@/models/TaskUpdate";
import Asset from "@/models/Asset";
import Approval from "@/models/Approval";
import Project from "@/models/Project";
import Team from "@/models/Team";
import User from "@/models/User";

const DUE_DAY_END_MS = 18.5 * 60 * 60 * 1000; // stored due date (UTC midnight) → 23:59 IST that day
const MAX_DAYS = 370;

// ---------- helpers ----------
export function rangeIST(from, to) {
    const start = new Date(`${from}T00:00:00.000+05:30`);
    const end = new Date(`${to}T23:59:59.999+05:30`);
    if ((end - start) / 86400000 > MAX_DAYS) throw new HttpError(400, "Pick a range of one year or less.");
    return { start, end };
}

const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";
const pct = (part, total) => (total ? `${Math.round((part / total) * 100)}%` : "—");
const round1 = (n) => Math.round((n || 0) * 10) / 10;

const PEOPLE_COLUMNS = [
    { key: "name", label: "Person" },
    { key: "team", label: "Team" },
    { key: "assigned", label: "Tasks assigned" },
    { key: "completed", label: "Completed" },
    { key: "onTime", label: "On time" },
    { key: "overdueOpen", label: "Overdue now" },
    { key: "hours", label: "Hours logged" },
    { key: "uploaded", label: "Assets uploaded" },
    { key: "sentBack", label: "Sent back" },
];

// ---------- core numbers per person ----------
async function metricsFor(userIds, start, end) {
    const today = startOfTodayIST();
    const inRange = (field) => ({ $and: [{ $gte: [field, start] }, { $lte: [field, end] }] });
    const doneInRange = { $and: [{ $eq: ["$status", "done"] }, inRange("$completedAt")] };

    const [taskRows, hourRows, assetRows, backRows] = await Promise.all([
        Task.aggregate([
            { $match: { assignedTo: { $in: userIds } } },
            {
                $group: {
                    _id: "$assignedTo",
                    assigned: { $sum: { $cond: [inRange("$createdAt"), 1, 0] } },
                    completed: { $sum: { $cond: [doneInRange, 1, 0] } },
                    onTime: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        doneInRange,
                                        { $or: [{ $eq: ["$dueDate", null] }, { $lte: ["$completedAt", { $add: ["$dueDate", DUE_DAY_END_MS] }] }] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    overdueOpen: {
                        $sum: {
                            $cond: [{ $and: [{ $ne: ["$status", "done"] }, { $ne: ["$dueDate", null] }, { $lt: ["$dueDate", today] }] }, 1, 0],
                        },
                    },
                },
            },
        ]),
        TaskUpdate.aggregate([
            { $match: { user: { $in: userIds }, createdAt: { $gte: start, $lte: end } } },
            { $group: { _id: "$user", hours: { $sum: "$hoursSpent" } } },
        ]),
        Asset.aggregate([
            { $match: { uploadedBy: { $in: userIds }, createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: "$uploadedBy",
                    uploaded: { $sum: 1 },
                    firstTime: { $sum: { $cond: [{ $and: [{ $eq: ["$currentVersion", 1] }, { $eq: ["$status", "approved"] }] }, 1, 0] } },
                },
            },
        ]),
        Approval.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end }, decision: { $in: ["changes_requested", "rejected"] } } },
            { $lookup: { from: Asset.collection.name, localField: "asset", foreignField: "_id", as: "a" } },
            { $unwind: "$a" },
            { $match: { "a.uploadedBy": { $in: userIds } } },
            { $group: { _id: "$a.uploadedBy", sentBack: { $sum: 1 } } },
        ]),
    ]);

    const byId = (rows) => new Map(rows.map((r) => [r._id.toString(), r]));
    const t = byId(taskRows), h = byId(hourRows), a = byId(assetRows), b = byId(backRows);

    const result = new Map();
    for (const id of userIds.map(String)) {
        result.set(id, {
            assigned: t.get(id)?.assigned || 0,
            completed: t.get(id)?.completed || 0,
            onTimeCount: t.get(id)?.onTime || 0,
            overdueOpen: t.get(id)?.overdueOpen || 0,
            hours: round1(h.get(id)?.hours),
            uploaded: a.get(id)?.uploaded || 0,
            firstTime: a.get(id)?.firstTime || 0,
            sentBack: b.get(id)?.sentBack || 0,
        });
    }
    return result;
}

function sumMetrics(list) {
    const keys = ["assigned", "completed", "onTimeCount", "overdueOpen", "hours", "uploaded", "firstTime", "sentBack"];
    const total = Object.fromEntries(keys.map((k) => [k, 0]));
    for (const m of list) for (const k of keys) total[k] += m[k];
    total.hours = round1(total.hours);
    return total;
}

function summaryCards(m) {
    return [
        { label: "Tasks assigned", value: m.assigned },
        { label: "Tasks completed", value: m.completed },
        { label: "Completed on time", value: pct(m.onTimeCount, m.completed) },
        { label: "Overdue now", value: m.overdueOpen },
        { label: "Hours logged", value: m.hours },
        { label: "Assets uploaded", value: m.uploaded },
        { label: "Approved first time", value: m.firstTime },
        { label: "Sent back for changes", value: m.sentBack },
    ];
}

function personRow(user, m) {
    return {
        name: user.name,
        team: user.team?.name || "—",
        assigned: m.assigned,
        completed: m.completed,
        onTime: pct(m.onTimeCount, m.completed),
        overdueOpen: m.overdueOpen,
        hours: m.hours,
        uploaded: m.uploaded,
        sentBack: m.sentBack,
    };
}

// ---------- permission checks ----------
function canSeeEmployee(me, target) {
    if (me.role === ROLES.ADMIN) return true;
    if (target._id.toString() === me.id) return true;
    if (me.role === ROLES.MANAGER) {
        return target.manager?.toString() === me.id || (!!me.team && target.team?._id?.toString() === me.team);
    }
    return false;
}

// ---------- reports ----------
export async function employeeReport(me, userId, start, end) {
    const target = await User.findById(userId || me.id, "name designation team manager").populate("team", "name").lean();
    if (!target || !canSeeEmployee(me, target)) throw new HttpError(404, "Person not found.");

    const id = target._id;
    const m = (await metricsFor([id], start, end)).get(id.toString());
    const today = startOfTodayIST();

    const [completed, open, hoursByProject] = await Promise.all([
        Task.find({ assignedTo: id, status: "done", completedAt: { $gte: start, $lte: end } })
            .populate("project", "name").sort({ completedAt: -1 }).lean(),
        Task.find({ assignedTo: id, status: { $ne: "done" } }).populate("project", "name").sort({ dueDate: 1 }).lean(),
        TaskUpdate.aggregate([
            { $match: { user: id, createdAt: { $gte: start, $lte: end } } },
            { $lookup: { from: Task.collection.name, localField: "task", foreignField: "_id", as: "t" } },
            { $unwind: "$t" },
            { $group: { _id: "$t.project", hours: { $sum: "$hoursSpent" } } },
            { $lookup: { from: Project.collection.name, localField: "_id", foreignField: "_id", as: "p" } },
            { $sort: { hours: -1 } },
        ]),
    ]);

    return {
        title: `Employee report: ${target.name}`,
        subtitle: [target.designation, target.team?.name].filter(Boolean).join(" · "),
        summary: summaryCards(m),
        tables: [
            {
                title: "Completed tasks",
                columns: [
                    { key: "task", label: "Task" }, { key: "project", label: "Project" },
                    { key: "due", label: "Due" }, { key: "completed", label: "Completed" }, { key: "onTime", label: "On time" },
                ],
                rows: completed.map((t) => ({
                    task: t.title,
                    project: t.project?.name || "—",
                    due: fmt(t.dueDate),
                    completed: fmt(t.completedAt),
                    onTime: !t.dueDate || t.completedAt <= new Date(t.dueDate.getTime() + DUE_DAY_END_MS) ? "Yes" : "No",
                })),
            },
            {
                title: "Open tasks (now)",
                columns: [
                    { key: "task", label: "Task" }, { key: "project", label: "Project" },
                    { key: "status", label: "Status" }, { key: "due", label: "Due" }, { key: "overdue", label: "Overdue" },
                ],
                rows: open.map((t) => ({
                    task: t.title,
                    project: t.project?.name || "—",
                    status: STATUS_LABELS[t.status],
                    due: fmt(t.dueDate),
                    overdue: t.dueDate && t.dueDate < today ? "Yes" : "No",
                })),
            },
            {
                title: "Hours by project",
                columns: [{ key: "project", label: "Project" }, { key: "hours", label: "Hours" }],
                rows: hoursByProject.map((r) => ({ project: r.p[0]?.name || "—", hours: round1(r.hours) })),
            },
        ],
    };
}

export async function teamReport(me, teamId, start, end) {
    if (me.role === ROLES.MEMBER) throw new HttpError(403, "Only managers and admins can run team reports.");

    let title, filter;
    if (me.role === ROLES.ADMIN) {
        if (!teamId) throw new HttpError(400, "Choose a team.");
        const team = await Team.findById(teamId, "name").lean();
        if (!team) throw new HttpError(404, "Team not found.");
        title = `Team report: ${team.name}`;
        filter = { isActive: true, team: teamId };
    } else {
        title = "Team report: my team";
        filter = { isActive: true, $or: [{ manager: me.id }, ...(me.team ? [{ team: me.team }] : [])] };
    }

    const people = await User.find(filter, "name designation team").populate("team", "name").sort({ name: 1 }).lean();
    const ids = people.map((p) => p._id);
    const metrics = await metricsFor(ids, start, end);
    const total = sumMetrics([...metrics.values()]);

    const overdue = await Task.find({ assignedTo: { $in: ids }, status: { $ne: "done" }, dueDate: { $lt: startOfTodayIST() } })
        .populate("assignedTo", "name").populate("project", "name").sort({ dueDate: 1 }).limit(200).lean();

    return {
        title,
        subtitle: `${people.length} people`,
        summary: summaryCards(total),
        tables: [
            { title: "People", columns: PEOPLE_COLUMNS, rows: people.map((p) => personRow(p, metrics.get(p._id.toString()))) },
            {
                title: "Overdue tasks (now)",
                columns: [
                    { key: "task", label: "Task" }, { key: "person", label: "Assigned to" },
                    { key: "project", label: "Project" }, { key: "due", label: "Due" },
                ],
                rows: overdue.map((t) => ({ task: t.title, person: t.assignedTo?.name, project: t.project?.name || "—", due: fmt(t.dueDate) })),
            },
        ],
    };
}

export async function companyReport(me, start, end) {
    if (me.role !== ROLES.ADMIN) throw new HttpError(403, "Only admins can run the company report.");

    const people = await User.find({ isActive: true, role: { $ne: ROLES.ADMIN } }, "name team").populate("team", "name").lean();
    const metrics = await metricsFor(people.map((p) => p._id), start, end);

    // Per team
    const teams = new Map();
    for (const p of people) {
        const key = p.team?.name || "No team";
        if (!teams.has(key)) teams.set(key, []);
        teams.get(key).push(metrics.get(p._id.toString()));
    }
    const teamRows = [...teams.entries()]
        .map(([name, list]) => {
            const s = sumMetrics(list);
            return {
                team: name, people: list.length, assigned: s.assigned, completed: s.completed,
                onTime: pct(s.onTimeCount, s.completed), overdueOpen: s.overdueOpen, hours: s.hours,
                uploaded: s.uploaded, sentBack: s.sentBack,
            };
        })
        .sort((a, b) => a.team.localeCompare(b.team));

    // Per project
    const today = startOfTodayIST();
    const [projTasks, projHours] = await Promise.all([
        Task.aggregate([
            {
                $group: {
                    _id: "$project",
                    completed: { $sum: { $cond: [{ $and: [{ $eq: ["$status", "done"] }, { $gte: ["$completedAt", start] }, { $lte: ["$completedAt", end] }] }, 1, 0] } },
                    open: { $sum: { $cond: [{ $ne: ["$status", "done"] }, 1, 0] } },
                    overdue: { $sum: { $cond: [{ $and: [{ $ne: ["$status", "done"] }, { $ne: ["$dueDate", null] }, { $lt: ["$dueDate", today] }] }, 1, 0] } },
                },
            },
        ]),
        TaskUpdate.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            { $lookup: { from: Task.collection.name, localField: "task", foreignField: "_id", as: "t" } },
            { $unwind: "$t" },
            { $group: { _id: "$t.project", hours: { $sum: "$hoursSpent" } } },
        ]),
    ]);
    const hoursMap = new Map(projHours.map((r) => [r._id.toString(), r.hours]));
    const projects = await Project.find({ _id: { $in: projTasks.map((r) => r._id) } }, "name status client")
        .populate("client", "name").lean();
    const projMap = new Map(projects.map((p) => [p._id.toString(), p]));

    const projectRows = projTasks
        .filter((r) => projMap.has(r._id.toString()))
        .map((r) => {
            const p = projMap.get(r._id.toString());
            return {
                project: p.name, client: p.client?.name || "Internal", status: STATUS_LABELS[p.status],
                completed: r.completed, open: r.open, overdue: r.overdue, hours: round1(hoursMap.get(r._id.toString())),
            };
        })
        .sort((a, b) => b.overdue - a.overdue || b.open - a.open);

    const total = sumMetrics([...metrics.values()]);

    return {
        title: "Company report",
        subtitle: `${people.length} people · ${teamRows.length} teams`,
        summary: summaryCards(total),
        tables: [
            {
                title: "By team",
                columns: [
                    { key: "team", label: "Team" }, { key: "people", label: "People" }, { key: "assigned", label: "Tasks assigned" },
                    { key: "completed", label: "Completed" }, { key: "onTime", label: "On time" }, { key: "overdueOpen", label: "Overdue now" },
                    { key: "hours", label: "Hours logged" }, { key: "uploaded", label: "Assets uploaded" }, { key: "sentBack", label: "Sent back" },
                ],
                rows: teamRows,
            },
            {
                title: "By project",
                columns: [
                    { key: "project", label: "Project" }, { key: "client", label: "Client" }, { key: "status", label: "Status" },
                    { key: "completed", label: "Completed in period" }, { key: "open", label: "Open now" },
                    { key: "overdue", label: "Overdue now" }, { key: "hours", label: "Hours in period" },
                ],
                rows: projectRows,
            },
            { title: "By person", columns: PEOPLE_COLUMNS, rows: people.map((p) => personRow(p, metrics.get(p._id.toString()))) },
        ],
    };
}