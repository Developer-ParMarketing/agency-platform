import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, createTaskSchema, objectId } from "@/lib/validation";
import { toTaskDTO } from "@/lib/serializers";
import { ROLES, TASK_STATUSES } from "@/lib/constants";
import { taskFilterFor, projectFilterFor, canAssignTo } from "@/services/access";
import { findTasksWithRefs, taskPermissions, statusFields } from "@/services/tasks";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import Project from "@/models/Project";
import User from "@/models/User";

// GET /api/tasks?project=ID&status=todo&scope=mine|assigned|team
export async function GET(request) {
    try {
        const me = await requireUser();
        await connectDB();

        const sp = new URL(request.url).searchParams;
        const filters = [await taskFilterFor(me)];

        const project = sp.get("project");
        if (project) {
            validate(objectId, project);
            filters.push({ project });
        }

        const status = sp.get("status");
        if (status && TASK_STATUSES.includes(status)) filters.push({ status });

        const scope = sp.get("scope");
        if (scope === "mine") filters.push({ assignedTo: me.id });
        if (scope === "assigned") filters.push({ assignedBy: me.id });
        if (scope === "team" && me.role === ROLES.MANAGER) {
            const [reports, teammates] = await Promise.all([
                User.distinct("_id", { manager: me.id }),
                me.team ? User.distinct("_id", { team: me.team }) : [],
            ]);
            const people = [...reports, ...teammates].map(String).filter((id) => id !== me.id);
            filters.push({ assignedTo: { $in: people } });
        }

        const tasks = await findTasksWithRefs({ $and: filters });
        return Response.json({ tasks: tasks.map((t) => toTaskDTO(t, taskPermissions(me, t))) });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    try {
        const me = await requireUser();
        requirePermission(me, "tasks.assign", HttpError);
        const data = validate(createTaskSchema, await request.json());

        await connectDB();

        const project = await Project.findOne({ $and: [{ _id: data.project }, await projectFilterFor(me)] }).lean();
        if (!project) throw new HttpError(404, "Project not found.");
        if (project.isArchived) throw new HttpError(400, "This project is archived. Restore it before adding tasks.");

        const assignee = await User.findById(data.assignedTo).lean();
        if (!canAssignTo(me, assignee)) {
            throw new HttpError(403, "You can only assign tasks to active members of your own team.");
        }

        const created = await Task.create({
            ...data,
            ...statusFields(data.status),
            assignedBy: me.id,
            team: assignee.team || null,
            client: project.client || null,
        });

        const [task] = await findTasksWithRefs({ _id: created._id }, 1);
        return Response.json({ task: toTaskDTO(task, taskPermissions(me, task)) }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}