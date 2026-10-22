import { HttpError } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";
import { validate, objectId } from "@/lib/validation";
import { taskFilterFor } from "@/services/access";
import Task from "@/models/Task";

const idOf = (x) => (x?._id ?? x)?.toString();

export function findTasksWithRefs(filter = {}, limit = 500) {
    return Task.find(filter)
        .populate("project", "name managers createdBy")
        .populate("assignedTo", "name manager team")
        .populate("assignedBy", "name")
        .populate("team", "name color")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
}

// What can `user` do with this task? (task must be loaded with findTasksWithRefs)
export function taskPermissions(user, task) {
    if (user.role === ROLES.ADMIN) return { canEdit: true, canChangeStatus: true, canAddUpdate: true };

    const project = task.project || {};
    const isLead =
        (project.managers || []).some((m) => idOf(m) === user.id) || idOf(project.createdBy) === user.id;
    const canEdit =
        idOf(task.assignedBy) === user.id || isLead || idOf(task.assignedTo?.manager) === user.id;
    const isAssignee = idOf(task.assignedTo) === user.id;
    const canChangeStatus = canEdit || isAssignee;

    return { canEdit, canChangeStatus, canAddUpdate: canChangeStatus };
}

// Loads a task only if the user is allowed to see it; otherwise 404
export async function loadVisibleTask(user, id) {
    validate(objectId, id);
    const [task] = await findTasksWithRefs({ $and: [{ _id: id }, await taskFilterFor(user)] }, 1);
    if (!task) throw new HttpError(404, "Task not found.");
    return task;
}

export function statusFields(status) {
    return { status, completedAt: status === "done" ? new Date() : null };
}