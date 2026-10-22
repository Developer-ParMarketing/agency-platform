import { HttpError } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";
import { validate, objectId } from "@/lib/validation";
import { projectFilterFor } from "@/services/access";
import { clientFilterFor, assertActiveUsers } from "@/services/clients";
import Meeting from "@/models/Meeting";
import Client from "@/models/Client";
import Project from "@/models/Project";

const idOf = (x) => (x?._id ?? x)?.toString();

export async function meetingFilterFor(user) {
    if (user.role === ROLES.ADMIN) return {};
    const [clients, projects] = await Promise.all([
        Client.distinct("_id", clientFilterFor(user)),
        Project.distinct("_id", await projectFilterFor(user)),
    ]);
    return {
        $or: [
            { createdBy: user.id },
            { attendees: user.id },
            { client: { $in: clients } },
            { client: null, project: { $in: projects } },
        ],
    };
}

export function meetingPermissions(user, meeting) {
    return {
        canEdit: user.role === ROLES.ADMIN || idOf(meeting.createdBy) === user.id,
        canCreateTasks: user.role !== ROLES.MEMBER,
    };
}

export function findMeetingsWithRefs(filter = {}, limit = 300) {
    return Meeting.find(filter)
        .populate("client", "name")
        .populate("project", "name")
        .populate("attendees", "name")
        .populate("createdBy", "name")
        .populate("actionItems.assignee", "name")
        .populate("actionItems.task", "title status")
        .sort({ date: -1 })
        .limit(limit)
        .lean();
}

export async function loadVisibleMeeting(user, id) {
    validate(objectId, id);
    const [meeting] = await findMeetingsWithRefs({ $and: [{ _id: id }, await meetingFilterFor(user)] }, 1);
    if (!meeting) throw new HttpError(404, "Meeting not found.");
    return meeting;
}

// The user must be able to see the chosen client/project; attendees must be active
export async function assertMeetingRefs(user, { client, project, attendees = [], actionItems = [] }) {
    if (client) {
        const ok = await Client.exists({ $and: [{ _id: client }, clientFilterFor(user)] });
        if (!ok) throw new HttpError(400, "You don't have access to that client.");
    }
    if (project) {
        const p = await Project.findOne({ $and: [{ _id: project }, await projectFilterFor(user)] }).lean();
        if (!p) throw new HttpError(400, "You don't have access to that project.");
        if (client && p.client && p.client.toString() !== client) {
            throw new HttpError(400, "That project belongs to a different client.");
        }
    }
    await assertActiveUsers([...attendees, ...actionItems.map((a) => a.assignee)]);
}