import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { toAssetDTO, toAssetVersionDTO, toApprovalDTO } from "@/lib/serializers";
import { loadVisibleAsset, assetPermissions } from "@/services/assets";
import { connectDB } from "@/lib/db";
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