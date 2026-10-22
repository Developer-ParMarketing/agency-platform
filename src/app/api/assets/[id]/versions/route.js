import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, newVersionSchema } from "@/lib/validation";
import { toAssetDTO, toAssetVersionDTO } from "@/lib/serializers";
import { FILE_TYPES } from "@/lib/file-types";
import { deleteFile } from "@/lib/storage";
import { parseUpload } from "@/services/upload";
import {
    loadVisibleAsset, assetPermissions, initialStatusFor, findAssetsWithRefs,
} from "@/services/assets";
import { connectDB } from "@/lib/db";
import Asset from "@/models/Asset";
import AssetVersion from "@/models/AssetVersion";
import Approval from "@/models/Approval";

export async function POST(request, { params }) {
    let saved = null;
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const asset = await loadVisibleAsset(me, id);
        if (!assetPermissions(me, asset).canUploadVersion) {
            throw new HttpError(403, "Only the uploader or an admin can upload a new version.");
        }
        if (asset.isArchived) throw new HttpError(400, "This asset is archived.");

        const { fields, file } = await parseUpload(request);
        if (!file) throw new HttpError(400, "Choose a file to upload.");
        saved = file;

        if (file.kind !== asset.type) {
            throw new HttpError(400, `The new version must also be a ${FILE_TYPES[asset.type].label} file.`);
        }

        const { changeNote } = validate(newVersionSchema, fields);
        const nextVersion = asset.currentVersion + 1;
        const status = initialStatusFor(me);

        const version = await AssetVersion.create({
            asset: id,
            version: nextVersion,
            filePath: file.rel,
            fileName: file.originalName,
            fileSize: file.size,
            mimeType: file.mimeType,
            uploadedBy: me.id,
            changeNote,
        });

        // Only move forward if nobody else uploaded a version at the same time
        const result = await Asset.updateOne(
            { _id: id, currentVersion: asset.currentVersion },
            {
                $set: {
                    currentVersion: nextVersion,
                    status,
                    approvedAt: status === "approved" ? new Date() : null,
                    current: { versionId: version._id, fileName: file.originalName, fileSize: file.size, mimeType: file.mimeType },
                },
            }
        );
        if (result.modifiedCount === 0) {
            await AssetVersion.deleteOne({ _id: version._id });
            throw new HttpError(409, "Someone else just uploaded a new version. Refresh and try again.");
        }

        if (status === "approved") {
            await Approval.create({
                asset: id, version: nextVersion, stage: "admin", reviewer: me.id,
                decision: "approved", comment: "Uploaded by admin",
            });
        }

        saved = null; // keep the file
        const [updated] = await findAssetsWithRefs({ _id: id }, 1);
        const savedVersion = await AssetVersion.findById(version._id).populate("uploadedBy", "name").lean();

        return Response.json(
            { asset: toAssetDTO(updated, assetPermissions(me, updated)), version: toAssetVersionDTO(savedVersion) },
            { status: 201 }
        );
    } catch (err) {
        if (saved) await deleteFile(saved.rel);
        return handleApiError(err);
    }
}