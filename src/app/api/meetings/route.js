import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { validate, createMeetingSchema, objectId } from "@/lib/validation";
import { toMeetingDTO } from "@/lib/serializers";
import { meetingFilterFor, meetingPermissions, findMeetingsWithRefs, assertMeetingRefs } from "@/services/meetings";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";

// GET /api/meetings?client=ID&project=ID
export async function GET(request) {
    try {
        const me = await requireUser();
        await connectDB();

        const sp = new URL(request.url).searchParams;
        const filters = [await meetingFilterFor(me)];
        for (const key of ["client", "project"]) {
            const value = sp.get(key);
            if (value) {
                validate(objectId, value);
                filters.push({ [key]: value });
            }
        }

        const meetings = await findMeetingsWithRefs({ $and: filters });
        return Response.json({ meetings: meetings.map((m) => toMeetingDTO(m, meetingPermissions(me, m))) });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    try {
        const me = await requireUser();
        const data = validate(createMeetingSchema, await request.json());

        await connectDB();
        await assertMeetingRefs(me, data);

        const created = await Meeting.create({
            ...data,
            actionItems: (data.actionItems || []).map(({ id, ...item }) => item),
            createdBy: me.id,
        });

        const [meeting] = await findMeetingsWithRefs({ _id: created._id }, 1);
        return Response.json({ meeting: toMeetingDTO(meeting, meetingPermissions(me, meeting)) }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}