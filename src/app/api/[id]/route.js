import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, updateTaskSchema } from "@/lib/validation";
import { toTaskDTO, toTaskUpdateDTO } from "@/lib/serializers";
import { canAssignTo } from "@/services/access";
import { findTasksWithRefs, loadVisibleTask, taskPermissions, statusFields } from "@/services/tasks";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import TaskUpdate from "@/models/TaskUpdate";
import User from "@/models/User";

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const task = await loadVisibleTask(me, id);
        const updates = await TaskUpdate.find({ task: id }).populate("user", "name").sort({ createdAt: -1 }).limit(100).lean();

        return Response.json({
            task: toTaskDTO(task, taskPermissions(me, task)),
            updates: updates.map(toTaskUpdateDTO),
        });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function PATCH(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const task = await loadVisibleTask(me, id);
        const perms = taskPermissions(me, task);
        const data = validate(updateTaskSchema, await request.json());

        const { status, ...details } = data;
        if (Object.keys(details).length && !perms.canEdit) {
            throw new HttpError(403, "Only the assigner, the project lead or a manager can edit this task.");
        }
        if (status && !perms.canChangeStatus) {
            throw new HttpError(403, "You can't change this task's status.");
        }

        // Dates: compare the new values with the existing ones
        const start = data.startDate !== undefined ? data.startDate : task.startDate;
        const due = data.dueDate !== undefined ? data.dueDate : task.dueDate;
        if (start && due && new Date(due) < new Date(start)) {
            throw new HttpError(400, "Due date can't be before the start date");
        }

        const update = { ...details };

        if (data.assignedTo && data.assignedTo !== task.assignedTo._id.toString()) {
            const assignee = await User.findById(data.assignedTo).lean();
            if (!canAssignTo(me, assignee)) {
                throw new HttpError(403, "You can only assign tasks to active members of your own team.");
            }
            update.team = assignee.team || null;
        }

        if (status && status !== task.status) {
            Object.assign(update, statusFields(status));
            await TaskUpdate.create({
                task: id,
                user: me.id,
                note: "Changed status",
                statusFrom: task.status,
                statusTo: status,
            });
        }

        await Task.updateOne({ _id: id }, { $set: update });
        const [updated] = await findTasksWithRefs({ _id: id }, 1);
        return Response.json({ task: toTaskDTO(updated, taskPermissions(me, updated)) });
    } catch (err) {
        return handleApiError(err);
    }
}