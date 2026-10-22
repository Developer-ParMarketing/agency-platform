import { HttpError } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";
import { validate, objectId } from "@/lib/validation";
import { assetFilterFor } from "@/services/access";
import Asset from "@/models/Asset";

const idOf = (x) => (x?._id ?? x)?.toString();

export function findAssetsWithRefs(filter = {}, limit = 500) {
    return Asset.find(filter)
        .populate("project", "name managers createdBy")
        .populate("task", "title")
        .populate("uploadedBy", "name manager team")
        .populate("team", "name color")
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean();
}

export async function loadVisibleAsset(user, id) {
    validate(objectId, id);
    const [asset] = await findAssetsWithRefs({ $and: [{ _id: id }, await assetFilterFor(user)] }, 1);
    if (!asset) throw new HttpError(404, "Asset not found.");
    return asset;
}

// First review stage depends on who uploads
export function initialStatusFor(user) {
    if (user.role === ROLES.ADMIN) return "approved";
    if (user.role === ROLES.MANAGER) return "pending_admin";
    return "pending_manager";
}

// What can `user` do with this asset? (asset loaded with findAssetsWithRefs)
export function assetPermissions(user, asset) {
    const isUploader = idOf(asset.uploadedBy) === user.id;
    const isAdmin = user.role === ROLES.ADMIN;
    const pending = asset.status === "pending_manager" || asset.status === "pending_admin";

    let canReview = false;
    if (isAdmin && pending) {
        canReview = true; // admin can act at any stage
    } else if (user.role === ROLES.MANAGER && asset.status === "pending_manager" && !isUploader) {
        const project = asset.project || {};
        canReview =
            idOf(asset.uploadedBy?.manager) === user.id ||
            (!!user.team && idOf(asset.team) === user.team) ||
            (project.managers || []).some((m) => idOf(m) === user.id);
    }

    return {
        canReview,
        canUploadVersion: isUploader || isAdmin,
        canEdit: isUploader || isAdmin,
    };
}