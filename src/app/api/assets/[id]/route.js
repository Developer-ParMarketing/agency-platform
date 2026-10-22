import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, updateAssetSchema } from "@/lib/validation";
import { toAssetDTO, toAssetVersionDTO, toApprovalDTO } from "@/lib/serializers";
import { loadVisibleAsset, assetPermissions, findAssetsWithRefs } from "@/services/assets";
import { connectDB } from "@/lib/db";
import Asset from "@/models/Asset";
import AssetVersion from "@/models/AssetVersion";
import Approval from "@/models/Approval";

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const asset = await loadVisibleAsset(me, id);
        const [versions, approvals] = await Promise.all([
            AssetVersion.find({ asset: id }).populate("uploadedBy", "name").sort({ version: -1 }).lean(),
            Approval.find({ asset: id }).populate("reviewer", "name").sort({ createdAt: -1 }).lean(),
        ]);

        return Response.json({
            asset: toAssetDTO(asset, assetPermissions(me, asset)),
            versions: versions.map(toAssetVersionDTO),
            approvals: approvals.map(toApprovalDTO),
        });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function PATCH(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const asset = await loadVisibleAsset(me, id);
        if (!assetPermissions(me, asset).canEdit) {
            throw new HttpError(403, "Only the uploader or an admin can edit this asset.");
        }

        const data = validate(updateAssetSchema, await request.json());
        await Asset.updateOne({ _id: id }, { $set: data });

        const [updated] = await findAssetsWithRefs({ _id: id }, 1);
        return Response.json({ asset: toAssetDTO(updated, assetPermissions(me, updated)) });
    } catch (err) {
        return handleApiError(err);
    }
}