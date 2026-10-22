import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, createClientSchema } from "@/lib/validation";
import { toClientDTO } from "@/lib/serializers";
import { CLIENT_STATUSES } from "@/lib/constants";
import { clientFilterFor, clientPermissions, findClientsWithRefs, assertActiveUsers } from "@/services/clients";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";

export async function GET(request) {
    try {
        const me = await requireUser();
        await connectDB();

        const sp = new URL(request.url).searchParams;
        const filters = [clientFilterFor(me), { isArchived: sp.get("archived") === "true" }];
        const status = sp.get("status");
        if (status && CLIENT_STATUSES.includes(status)) filters.push({ status });

        const clients = await findClientsWithRefs({ $and: filters });
        return Response.json({ clients: clients.map((c) => toClientDTO(c, clientPermissions(me, c))) });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    try {
        const me = await requireUser();
        requirePermission(me, "clients.create", HttpError);
        const data = validate(createClientSchema, await request.json());

        await connectDB();
        await assertActiveUsers([data.accountManager, ...(data.accessUsers || []), ...(data.dealVisibleTo || [])]);

        const created = await Client.create({ ...data, createdBy: me.id });
        const [client] = await findClientsWithRefs({ _id: created._id });
        return Response.json({ client: toClientDTO(client, clientPermissions(me, client)) }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}