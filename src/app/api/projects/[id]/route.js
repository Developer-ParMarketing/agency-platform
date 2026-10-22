import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, updateProjectSchema, objectId } from "@/lib/validation";
import { toProjectDTO } from "@/lib/serializers";
import { projectFilterFor, canEditProject } from "@/services/access";
import { findProjectsWithRefs, progressFor, assertProjectRefs } from "@/services/projects";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

async function loadVisibleProject(me, id) {
    validate(objectId, id);
    await connectDB();
    const [project] = await findProjectsWithRefs({ $and: [{ _id: id }, await projectFilterFor(me)] });
    if (!project) throw new HttpError(404, "Project not found."); // also hides projects you can't see
    return project;
}

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        const project = await loadVisibleProject(me, id);
        const progress = await progressFor([id]);
        return Response.json({
            project: toProjectDTO(project, progress[id]),
            canEdit: canEditProject(me, project),
        });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function PATCH(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        const project = await loadVisibleProject(me, id);
        if (!canEditProject(me, project)) throw new HttpError(403, "Only the project's leads or an admin can edit it.");

        const data = validate(updateProjectSchema, await request.json());
        await assertProjectRefs(data);

        await Project.updateOne({ _id: id }, { $set: data });
        const [updated] = await findProjectsWithRefs({ _id: id });
        const progress = await progressFor([id]);
        return Response.json({ project: toProjectDTO(updated, progress[id]) });
    } catch (err) {
        return handleApiError(err);
    }
}