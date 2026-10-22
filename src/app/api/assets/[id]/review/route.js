import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, reviewAssetSchema } from "@/lib/validation";
import { toAssetDTO, toApprovalDTO } from "@/lib/serializers";
import { loadVisibleAsset, assetPermissions, reviewOutcome, findAssetsWithRefs } from "@/services/assets";
import { connectDB } from "@/lib/db";
import Asset from "@/models/Asset";
import Approval from "@/models/Approval";

export async function POST(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const asset = await loadVisibleAsset(me, id);
        if (!assetPermissions(me, asset).canReview) {
            throw new HttpError(403, "This asset isn't waiting for your review.");
        }

        const data = validate(reviewAssetSchema, await request.json());
        const { stage, nextStatus } = reviewOutcome(me, asset, data.decision);

        // Only update if nobody changed the status in the meantime
        const result = await Asset.updateOne(
            { _id: id, status: asset.status, currentVersion: asset.currentVersion },
            { $set: { status: nextStatus, approvedAt: nextStatus === "approved" ? new Date() : null } }
        );
        if (result.modifiedCount === 0) {
            throw new HttpError(409, "Someone else just reviewed this asset. Refresh to see the latest.");
        }

        const approval = await Approval.create({
            asset: id,
            version: asset.currentVersion,
            stage,
            reviewer: me.id,
            decision: data.decision,
            keyPoints: data.keyPoints,
            comment: data.comment,
        });

        const [updated] = await findAssetsWithRefs({ _id: id }, 1);
        const saved = await Approval.findById(approval._id).populate("reviewer", "name").lean();

        return Response.json({
            asset: toAssetDTO(updated, assetPermissions(me, updated)),
            approval: toApprovalDTO(saved),
        });
    } catch (err) {
        return handleApiError(err);
    }
}