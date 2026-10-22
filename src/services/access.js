import { ROLES } from "@/lib/constants";
import User from "@/models/User";
import Project from "@/models/Project";
import Task from "@/models/Task";

const ids = (list) => list.map((x) => x.toString());

// Which projects can this user see?
export async function projectFilterFor(user) {
    if (user.role === ROLES.ADMIN) return {};

    if (user.role === ROLES.MANAGER) {
        const or = [{ managers: user.id }, { members: user.id }, { createdBy: user.id }];
        if (user.team) or.push({ teams: user.team });
        return { $or: or };
    }

    // member: projects they were added to, or where they have a task
    const withMyTasks = await Task.distinct("project", { assignedTo: user.id });
    return { $or: [{ members: user.id }, { _id: { $in: withMyTasks } }] };
}

// Which tasks can this user see?
export async function taskFilterFor(user) {
    if (user.role === ROLES.ADMIN) return {};

    if (user.role === ROLES.MANAGER) {
        const [reports, teammates, projects] = await Promise.all([
            User.distinct("_id", { manager: user.id }),
            user.team ? User.distinct("_id", { team: user.team }) : [],
            Project.distinct("_id", await projectFilterFor(user)),
        ]);
        const people = [...new Set([user.id, ...ids(reports), ...ids(teammates)])];
        return {
            $or: [{ assignedTo: { $in: people } }, { assignedBy: user.id }, { project: { $in: projects } }],
        };
    }

    // member: own tasks + every task in a project they're a member of (shared progress)
    const memberProjects = await Project.distinct("_id", { members: user.id });
    return { $or: [{ assignedTo: user.id }, { project: { $in: memberProjects } }] };
}

export function canEditProject(user, project) {
    if (user.role === ROLES.ADMIN) return true;
    return (
        project.createdBy?.toString() === user.id ||
        project.managers.some((m) => (m._id ?? m).toString() === user.id)
    );
}

// Can `user` assign a task to `assignee`?
export function canAssignTo(user, assignee) {
    if (!assignee?.isActive) return false;
    if (user.role === ROLES.ADMIN) return true;
    if (user.role === ROLES.MANAGER) {
        return (
            assignee._id.toString() === user.id ||
            assignee.manager?.toString() === user.id ||
            (user.team && assignee.team?.toString() === user.team)
        );
    }
    return false; // members don't assign tasks
}

// Which assets can this user see?
export async function assetFilterFor(user) {
    if (user.role === ROLES.ADMIN) return {};

    if (user.role === ROLES.MANAGER) {
        const [reports, projects] = await Promise.all([
            User.distinct("_id", { manager: user.id }),
            Project.distinct("_id", await projectFilterFor(user)),
        ]);
        const or = [{ uploadedBy: user.id }, { uploadedBy: { $in: reports } }, { project: { $in: projects } }];
        if (user.team) or.push({ team: user.team });
        return { $or: or };
    }

    const memberProjects = await Project.distinct("_id", { members: user.id });
    return { $or: [{ uploadedBy: user.id }, { project: { $in: memberProjects } }] };
}