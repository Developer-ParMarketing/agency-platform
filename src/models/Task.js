import mongoose from "mongoose";
import { TASK_STATUSES, PRIORITIES } from "@/lib/constants";

const { ObjectId } = mongoose.Schema.Types;

const TaskSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        project: { type: ObjectId, ref: "Project", required: true },
        assignedTo: { type: ObjectId, ref: "User", required: true },
        assignedBy: { type: ObjectId, ref: "User", required: true },
        team: { type: ObjectId, ref: "Team", default: null }, // the assignee's team, for reports
        status: { type: String, enum: TASK_STATUSES, default: "todo" },
        priority: { type: String, enum: PRIORITIES, default: "medium" },
        startDate: { type: Date, default: null },
        dueDate: { type: Date, default: null },
        estimatedHours: { type: Number, default: 0, min: 0 },
        loggedHours: { type: Number, default: 0, min: 0 },
        completedAt: { type: Date, default: null },
        meeting: { type: ObjectId, ref: "Meeting", default: null }, // used in Phase 5
        client: { type: ObjectId, ref: "Client", default: null },
    },
    { timestamps: true }
);

TaskSchema.index({ project: 1, status: 1 });
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);