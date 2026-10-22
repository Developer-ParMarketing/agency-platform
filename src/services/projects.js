import mongoose from "mongoose";
import { HttpError } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";
import Project from "@/models/Project";
import Task from "@/models/Task";
import Team from "@/models/Team";
import User from "@/models/User";

export function findProjectsWithRefs(filter = {}) {
    return Project.find(filter)
        .populate("client", "name")
        .populate("teams", "name color")
        .populate("managers", "name")
        .populate("members", "name")
        .populate("createdBy", "name")
        .sort({ updatedAt: -1 })
        .lean();
}

// Task counts per project: { [projectId]: { total, done, percent, byStatus } }
export async function progressFor(projectIds) {
    const rows = await Task.aggregate([
        { $match: { project: { $in: projectIds.map((id) => new mongoose.Types.ObjectId(id)) } } },
        { $group: { _id: { project: "$project", status: "$status" }, count: { $sum: 1 } } },
    ]);

    const result = {};
    for (const { _id, count } of rows) {
        const key = _id.project.toString();
        result[key] ??= { total: 0, done: 0, percent: 0, byStatus: {} };
        result[key].total += count;
        result[key].byStatus[_id.status] = count;
        if (_id.status === "done") result[key].done += count;
    }
    for (const p of Object.values(result)) {
        p.percent = p.total ? Math.round((p.done / p.total) * 100) : 0;
    }
    return result;
}

// Make sure every team and user picked for a project exists and is active
export async function assertProjectRefs({ teams = [], managers = [], members = [] }) {
    const uniq = (a) => [...new Set(a)];

    if (teams.length) {
        const count = await Team.countDocuments({ _id: { $in: uniq(teams) }, isActive: true });
        if (count !== uniq(teams).length) throw new HttpError(400, "One of the selected teams doesn't exist.");
    }
    if (managers.length) {
        const count = await User.countDocuments({
            _id: { $in: uniq(managers) },
            isActive: true,
            role: { $in: [ROLES.ADMIN, ROLES.MANAGER] },
        });
        if (count !== uniq(managers).length) {
            throw new HttpError(400, "Project leads must be active managers or admins.");
        }
    }
    if (members.length) {
        const count = await User.countDocuments({ _id: { $in: uniq(members) }, isActive: true });
        if (count !== uniq(members).length) throw new HttpError(400, "One of the selected members isn't active.");
    }
}