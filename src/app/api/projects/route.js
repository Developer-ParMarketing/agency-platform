import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, createProjectSchema } from "@/lib/validation";
import { toProjectDTO } from "@/lib/serializers";
import { ROLES, PROJECT_STATUSES } from "@/lib/constants";
import { projectFilterFor } from "@/services/access";
import { findProjectsWithRefs, progressFor, assertProjectRefs } from "@/services/projects";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";

export async function GET(request) {
    try {
        const me = await requireUser();
        await connectDB();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const archived = searchParams.get("archived") === "true";

        const filters = [await projectFilterFor(me), { isArchived: archived }];
        if (status && PROJECT_STATUSES.includes(status)) filters.push({ status });

        const projects = await findProjectsWithRefs({ $and: filters });
        const progress = await progressFor(projects.map((p) => p._id.toString()));

        return Response.json({
            projects: projects.map((p) => toProjectDTO(p, progress[p._id.toString()])),
        });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    try {
        const me = await requireUser();
        requirePermission(me, "projects.create", HttpError);
        const data = validate(createProjectSchema, await request.json());

        // A manager creating a project is always one of its leads, and their team is included
        if (me.role === ROLES.MANAGER) {
            if (!data.managers.includes(me.id)) data.managers.push(me.id);
            if (me.team && !data.teams.includes(me.team)) data.teams.push(me.team);
        }

        await connectDB();
        await assertProjectRefs(data);

        const created = await Project.create({ ...data, createdBy: me.id });
        const [project] = await findProjectsWithRefs({ _id: created._id });
        return Response.json({ project: toProjectDTO(project) }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}