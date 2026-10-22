import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const AssetVersionSchema = new mongoose.Schema(
    {
        asset: { type: ObjectId, ref: "Asset", required: true },
        version: { type: Number, required: true },
        filePath: { type: String, required: true }, // relative to UPLOAD_DIR
        fileName: { type: String, required: true }, // original name
        fileSize: { type: Number, required: true },
        mimeType: { type: String, required: true },
        uploadedBy: { type: ObjectId, ref: "User", required: true },
        changeNote: { type: String, trim: true, default: "" },
    },
    { timestamps: true }
);

AssetVersionSchema.index({ asset: 1, version: -1 }, { unique: true });

export default mongoose.models.AssetVersion || mongoose.model("AssetVersion", AssetVersionSchema);