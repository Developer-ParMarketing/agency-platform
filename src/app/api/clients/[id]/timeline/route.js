import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { loadVisibleClient } from "@/services/clients";
import { meetingFilterFor } from "@/services/meetings";
import { taskFilterFor, assetFilterFor } from "@/services/access";
import { connectDB } from "@/lib/db";
import Meeting from "@/models/Meeting";
import Task from "@/models/Task";
import Asset from "@/models/Asset";

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();
        await loadVisibleClient(me, id); // 404 if no access

        const [meetingF, taskF, assetF] = await Promise.all([meetingFilterFor(me), taskFilterFor(me), assetFilterFor(me)]);

        const [meetings, tasks, assets] = await Promise.all([
            Meeting.find({ $and: [{ client: id }, meetingF] }, "title date").sort({ date: -1 }).limit(50).lean(),
            Task.find({ $and: [{ client: id }, taskF] }, "title createdAt completedAt assignedTo")
                .populate("assignedTo", "name").sort({ createdAt: -1 }).limit(100).lean(),
            Asset.find({ $and: [{ client: id, isArchived: false }, assetF] }, "title createdAt approvedAt uploadedBy")
                .populate("uploadedBy", "name").sort({ createdAt: -1 }).limit(100).lean(),
        ]);

        const events = [];
        for (const m of meetings) {
            events.push({ type: "meeting", date: m.date, title: m.title, detail: "Meeting", href: `/meetings/${m._id}` });
        }
        for (const t of tasks) {
            const href = `/tasks/${t._id}`;
            events.push({ type: "task", date: t.createdAt, title: t.title, detail: `Task assigned to ${t.assignedTo?.name || "—"}`, href });
            if (t.completedAt) events.push({ type: "task_done", date: t.completedAt, title: t.title, detail: "Task completed", href });
        }
        for (const a of assets) {
            const href = `/assets/${a._id}`;
            events.push({ type: "asset", date: a.createdAt, title: a.title, detail: `Uploaded by ${a.uploadedBy?.name || "—"}`, href });
            if (a.approvedAt) events.push({ type: "asset_approved", date: a.approvedAt, title: a.title, detail: "Asset approved", href });
        }

        events.sort((x, y) => new Date(y.date) - new Date(x.date));
        return Response.json({ events: events.slice(0, 100) });
    } catch (err) {
        return handleApiError(err);
    }
}