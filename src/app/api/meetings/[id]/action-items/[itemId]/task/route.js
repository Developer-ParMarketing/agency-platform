import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, taskFromActionSchema } from "@/lib/validation";
import { toMeetingDTO } from "@/lib/serializers";
import { formatDate } from "@/lib/format";
import { projectFilterFor, canAssignTo } from "@/services/access";
import { loadVisibleMeeting, meetingPermissions, findMeetingsWithRefs } from "@/services/meetings";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";

export async function POST(request, { params }) {
    try {
        const me = await requireUser();
        requirePermission(me, "tasks.assign", HttpError);
        const { id, itemId } = await params;
        await connectDB();

        const meeting = await loadVisibleMeeting(me, id);
        const item = meeting.actionItems.find((a) => a._id.toString() === itemId);
        if (!item) throw new HttpError(404, "Action item not found.");
        if (item.task) throw new HttpError(409, "This action item already has a task.");
        if (!item.assignee) throw new HttpError(400, "Edit the meeting and choose who this action item is for first.");

        const body = validate(taskFromActionSchema, await request.json().catch(() => ({})));
        const projectId = meeting.project?._id?.toString() || body.project;
        if (!projectId) throw new HttpError(400, "Choose a project for this task.");

        const project = await Project.findOne({ $and: [{ _id: projectId }, await projectFilterFor(me)] }).lean();
        if (!project) throw new HttpError(404, "Project not found.");
        if (project.isArchived) throw new HttpError(400, "That project is archived.");

        const assignee = await User.findById(item.assignee._id).lean();
        if (!canAssignTo(me, assignee)) {
            throw new HttpError(403, `You can't assign tasks to ${assignee?.name || "this person"}.`);
        }

        const task = await Task.create({
            title: item.text.slice(0, 200),
            description: `From meeting "${meeting.title}" on ${formatDate(meeting.date)}.\n\n${item.text}`,
            project: projectId,
            assignedTo: assignee._id,
            assignedBy: me.id,
            team: assignee.team || null,
            priority: body.priority,
            dueDate: item.dueDate || null,
            meeting: meeting._id,
            client: meeting.client?._id || project.client || null,
        });

        await Meeting.updateOne({ _id: id, "actionItems._id": itemId }, { $set: { "actionItems.$.task": task._id } });

        const [updated] = await findMeetingsWithRefs({ _id: id }, 1);
        return Response.json({ meeting: toMeetingDTO(updated, meetingPermissions(me, updated)) }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}