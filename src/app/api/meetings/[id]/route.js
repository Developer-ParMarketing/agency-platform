import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, updateMeetingSchema } from "@/lib/validation";
import { toMeetingDTO } from "@/lib/serializers";
import { loadVisibleMeeting, meetingPermissions, findMeetingsWithRefs, assertMeetingRefs } from "@/services/meetings";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();
        const meeting = await loadVisibleMeeting(me, id);
        return Response.json({ meeting: toMeetingDTO(meeting, meetingPermissions(me, meeting)) });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function PATCH(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const meeting = await loadVisibleMeeting(me, id);
        if (!meetingPermissions(me, meeting).canEdit) {
            throw new HttpError(403, "Only the person who created this meeting or an admin can edit it.");
        }

        const data = validate(updateMeetingSchema, await request.json());
        const client = data.client !== undefined ? data.client : meeting.client?._id?.toString() ?? null;
        const project = data.project !== undefined ? data.project : meeting.project?._id?.toString() ?? null;
        if (!client && !project) throw new HttpError(400, "Link the meeting to a client or a project");

        await assertMeetingRefs(me, { client, project, attendees: data.attendees, actionItems: data.actionItems });

        // Keep task links on action items that still exist
        if (data.actionItems) {
            const existing = new Map(meeting.actionItems.map((a) => [a._id.toString(), a]));
            data.actionItems = data.actionItems.map(({ id: itemId, ...item }) => {
                const old = itemId && existing.get(itemId);
                return old ? { _id: old._id, ...item, task: old.task?._id ?? null } : item;
            });
        }

        await Meeting.updateOne({ _id: id }, { $set: data });
        const [updated] = await findMeetingsWithRefs({ _id: id }, 1);
        return Response.json({ meeting: toMeetingDTO(updated, meetingPermissions(me, updated)) });
    } catch (err) {
        return handleApiError(err);
    }
}