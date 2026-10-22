import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const TaskUpdateSchema = new mongoose.Schema(
    {
        task: { type: ObjectId, ref: "Task", required: true },
        user: { type: ObjectId, ref: "User", required: true },
        note: { type: String, required: true, trim: true, maxlength: 2000 },
        hoursSpent: { type: Number, default: 0, min: 0 },
        statusFrom: { type: String, default: null },
        statusTo: { type: String, default: null },
    },
    { timestamps: true }
);

TaskUpdateSchema.index({ task: 1, createdAt: -1 });
TaskUpdateSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.TaskUpdate || mongoose.model("TaskUpdate", TaskUpdateSchema);