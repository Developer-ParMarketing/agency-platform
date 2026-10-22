import mongoose from "mongoose";
import { ASSET_STATUSES } from "@/lib/constants";
import { FILE_TYPES } from "@/lib/file-types";

const { ObjectId } = mongoose.Schema.Types;

const AssetSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true, default: "" },
        type: { type: String, enum: Object.keys(FILE_TYPES), required: true },
        project: { type: ObjectId, ref: "Project", required: true },
        task: { type: ObjectId, ref: "Task", default: null },
        client: { type: ObjectId, ref: "Client", default: null },
        team: { type: ObjectId, ref: "Team", default: null }, // uploader's team
        uploadedBy: { type: ObjectId, ref: "User", required: true },
        status: { type: String, enum: ASSET_STATUSES, required: true },
        currentVersion: { type: Number, default: 1 },
        // copy of the latest version's file info, so lists don't need a second query
        current: {
            versionId: { type: ObjectId, ref: "AssetVersion" },
            fileName: String,
            fileSize: Number,
            mimeType: String,
        },
        approvedAt: { type: Date, default: null },
        isArchived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

AssetSchema.index({ project: 1, status: 1 });
AssetSchema.index({ uploadedBy: 1, createdAt: -1 });
AssetSchema.index({ status: 1, team: 1 });

export default mongoose.models.Asset || mongoose.model("Asset", AssetSchema);