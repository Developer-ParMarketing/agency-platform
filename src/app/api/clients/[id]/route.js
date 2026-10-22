import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, updateClientSchema } from "@/lib/validation";
import { toClientDTO, toProjectDTO } from "@/lib/serializers";
import { projectFilterFor } from "@/services/access";
import { findProjectsWithRefs } from "@/services/projects";
import { loadVisibleClient, clientPermissions, findClientsWithRefs, assertActiveUsers } from "@/services/clients";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";

// Fields only an admin may change
const ADMIN_FIELDS = ["deal", "accessUsers", "dealVisibleTo", "accountManager", "isArchived"];

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const client = await loadVisibleClient(me, id);
        const projects = await findProjectsWithRefs({ $and: [{ client: id }, await projectFilterFor(me)] });

        return Response.json({
            client: toClientDTO(client, clientPermissions(me, client)),
            projects: projects.map((p) => toProjectDTO(p)),
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

        const client = await loadVisibleClient(me, id);
        const perms = clientPermissions(me, client);
        if (!perms.canEdit) throw new HttpError(403, "Only the account manager or an admin can edit this client.");

        const data = validate(updateClientSchema, await request.json());
        if (!perms.canEditDeal && ADMIN_FIELDS.some((f) => data[f] !== undefined)) {
            throw new HttpError(403, "Only an admin can change the deal, access list or account manager.");
        }

        await assertActiveUsers([data.accountManager, ...(data.accessUsers || []), ...(data.dealVisibleTo || [])]);
        await Client.updateOne({ _id: id }, { $set: data });

        const [updated] = await findClientsWithRefs({ _id: id });
        return Response.json({ client: toClientDTO(updated, clientPermissions(me, updated)) });
    } catch (err) {
        return handleApiError(err);
    }
}