import mongoose from "mongoose";
import { APPROVAL_DECISIONS } from "@/lib/constants";

const { ObjectId } = mongoose.Schema.Types;

const ApprovalSchema = new mongoose.Schema(
    {
        asset: { type: ObjectId, ref: "Asset", required: true },
        version: { type: Number, required: true },
        stage: { type: String, enum: ["manager", "admin"], required: true },
        reviewer: { type: ObjectId, ref: "User", required: true },
        decision: { type: String, enum: APPROVAL_DECISIONS, required: true },
        keyPoints: [{ type: String, trim: true }],
        comment: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

ApprovalSchema.index({ asset: 1, createdAt: -1 });
ApprovalSchema.index({ reviewer: 1, createdAt: -1 });

export default mongoose.models.Approval || mongoose.model("Approval", ApprovalSchema);