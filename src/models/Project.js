import mongoose from "mongoose";
import { PROJECT_STATUSES, PRIORITIES } from "@/lib/constants";

const { ObjectId } = mongoose.Schema.Types;

const ProjectSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        client: { type: ObjectId, ref: "Client", default: null }, // used in Phase 5
        teams: [{ type: ObjectId, ref: "Team" }],
        managers: [{ type: ObjectId, ref: "User" }], // project leads
        members: [{ type: ObjectId, ref: "User" }], // anyone else added (other teams too)
        createdBy: { type: ObjectId, ref: "User", required: true },
        status: { type: String, enum: PROJECT_STATUSES, default: "planning" },
        priority: { type: String, enum: PRIORITIES, default: "medium" },
        startDate: { type: Date, default: null },
        dueDate: { type: Date, default: null },
        isArchived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ProjectSchema.index({ managers: 1 });
ProjectSchema.index({ members: 1 });
ProjectSchema.index({ teams: 1 });
ProjectSchema.index({ status: 1 });

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);