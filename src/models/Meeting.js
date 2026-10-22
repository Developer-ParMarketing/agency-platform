import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const ActionItemSchema = new mongoose.Schema({
    text: { type: String, required: true, trim: true },
    assignee: { type: ObjectId, ref: "User", default: null },
    dueDate: { type: Date, default: null },
    task: { type: ObjectId, ref: "Task", default: null }, // set when turned into a task
});

const MeetingSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        client: { type: ObjectId, ref: "Client", default: null },
        project: { type: ObjectId, ref: "Project", default: null },
        attendees: [{ type: ObjectId, ref: "User" }],
        externalAttendees: { type: String, trim: true, default: "" }, // client-side people
        agenda: { type: String, trim: true, default: "" },
        notes: { type: String, trim: true, default: "" },
        decisions: { type: String, trim: true, default: "" },
        actionItems: { type: [ActionItemSchema], default: [] },
        createdBy: { type: ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

MeetingSchema.index({ client: 1, date: -1 });
MeetingSchema.index({ project: 1, date: -1 });
MeetingSchema.index({ attendees: 1 });

export default mongoose.models.Meeting || mongoose.model("Meeting", MeetingSchema);