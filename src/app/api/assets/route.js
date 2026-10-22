import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, createAssetSchema, objectId } from "@/lib/validation";
import { toAssetDTO } from "@/lib/serializers";
import { ASSET_STATUSES } from "@/lib/constants";
import { deleteFile } from "@/lib/storage";
import { parseUpload } from "@/services/upload";
import { assetFilterFor, projectFilterFor, taskFilterFor } from "@/services/access";
import { findAssetsWithRefs, initialStatusFor, assetPermissions } from "@/services/assets";
import { connectDB } from "@/lib/db";
import Asset from "@/models/Asset";
import AssetVersion from "@/models/AssetVersion";
import Approval from "@/models/Approval";
import Project from "@/models/Project";
import Task from "@/models/Task";

// GET /api/assets?project=ID&status=pending_manager&scope=mine|review
export async function GET(request) {
    try {
        const me = await requireUser();
        await connectDB();

        const sp = new URL(request.url).searchParams;
        const filters = [await assetFilterFor(me), { isArchived: false }];

        const project = sp.get("project");
        if (project) {
            validate(objectId, project);
            filters.push({ project });
        }
        const status = sp.get("status");
        if (status && ASSET_STATUSES.includes(status)) filters.push({ status });
        if (sp.get("scope") === "mine") filters.push({ uploadedBy: me.id });

        let assets = await findAssetsWithRefs({ $and: filters });
        let result = assets.map((a) => toAssetDTO(a, assetPermissions(me, a)));

        // "review" = things waiting for MY decision
        if (sp.get("scope") === "review") result = result.filter((a) => a.permissions.canReview);

        return Response.json({ assets: result });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    let saved = null;
    try {
        const me = await requireUser();
        requirePermission(me, "assets.upload", HttpError);
        await connectDB();

        const { fields, file } = await parseUpload(request);
        if (!file) throw new HttpError(400, "Choose a file to upload.");
        saved = file;

        const data = validate(createAssetSchema, fields);

        const project = await Project.findOne({ $and: [{ _id: data.project }, await projectFilterFor(me)] }).lean();
        if (!project) throw new HttpError(404, "Project not found.");
        if (project.isArchived) throw new HttpError(400, "This project is archived.");

        if (data.task) {
            const task = await Task.findOne({ $and: [{ _id: data.task, project: data.project }, await taskFilterFor(me)] }).lean();
            if (!task) throw new HttpError(400, "That task isn't part of this project.");
        }

        const status = initialStatusFor(me);
        const asset = await Asset.create({
            title: data.title || file.originalName.replace(/\.[^.]+$/, ""),
            description: data.description,
            type: file.kind,
            project: data.project,
            task: data.task,
            client: project.client || null,
            team: me.team || null,
            uploadedBy: me.id,
            status,
            currentVersion: 1,
            approvedAt: status === "approved" ? new Date() : null,
        });

        const version = await AssetVersion.create({
            asset: asset._id,
            version: 1,
            filePath: file.rel,
            fileName: file.originalName,
            fileSize: file.size,
            mimeType: file.mimeType,
            uploadedBy: me.id,
        });

        await Asset.updateOne(
            { _id: asset._id },
            { current: { versionId: version._id, fileName: file.originalName, fileSize: file.size, mimeType: file.mimeType } }
        );

        if (status === "approved") {
            await Approval.create({
                asset: asset._id, version: 1, stage: "admin", reviewer: me.id,
                decision: "approved", comment: "Uploaded by admin",
            });
        }

        saved = null; // stored successfully — keep the file
        const [full] = await findAssetsWithRefs({ _id: asset._id }, 1);
        return Response.json({ asset: toAssetDTO(full, assetPermissions(me, full)) }, { status: 201 });
    } catch (err) {
        if (saved) await deleteFile(saved.rel); // don't leave orphan files on disk
        return handleApiError(err);
    }
}