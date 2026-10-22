import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, taskProgressSchema } from "@/lib/validation";
import { toTaskDTO, toTaskUpdateDTO } from "@/lib/serializers";
import { findTasksWithRefs, loadVisibleTask, taskPermissions, statusFields } from "@/services/tasks";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import TaskUpdate from "@/models/TaskUpdate";

export async function POST(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const task = await loadVisibleTask(me, id);
        if (!taskPermissions(me, task).canAddUpdate) {
            throw new HttpError(403, "Only the assignee or their managers can add progress to this task.");
        }

        const data = validate(taskProgressSchema, await request.json());
        const statusChanged = data.status && data.status !== task.status;

        const created = await TaskUpdate.create({
            task: id,
            user: me.id,
            note: data.note,
            hoursSpent: data.hoursSpent,
            statusFrom: statusChanged ? task.status : null,
            statusTo: statusChanged ? data.status : null,
        });

        await Task.updateOne(
            { _id: id },
            {
                $inc: { loggedHours: data.hoursSpent },
                ...(statusChanged ? { $set: statusFields(data.status) } : {}),
            }
        );

        const [updatedTask] = await findTasksWithRefs({ _id: id }, 1);
        const update = await TaskUpdate.findById(created._id).populate("user", "name").lean();

        return Response.json(
            { update: toTaskUpdateDTO(update), task: toTaskDTO(updatedTask, taskPermissions(me, updatedTask)) },
            { status: 201 }
        );
    } catch (err) {
        return handleApiError(err);
    }
}