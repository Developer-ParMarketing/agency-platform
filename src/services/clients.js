import { HttpError } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";
import { validate, objectId } from "@/lib/validation";
import Client from "@/models/Client";
import User from "@/models/User";

const idOf = (x) => (x?._id ?? x)?.toString();

export function clientFilterFor(user) {
    if (user.role === ROLES.ADMIN) return {};
    return { $or: [{ accessUsers: user.id }, { accountManager: user.id }] };
}

export function clientPermissions(user, client) {
    const isAdmin = user.role === ROLES.ADMIN;
    const isAccountManager = idOf(client.accountManager) === user.id;
    return {
        canEdit: isAdmin || isAccountManager,
        canEditDeal: isAdmin,
        canManageAccess: isAdmin,
        canSeeDeal: isAdmin || (client.dealVisibleTo || []).some((u) => idOf(u) === user.id),
    };
}

export function findClientsWithRefs(filter = {}) {
    return Client.find(filter)
        .populate("accountManager", "name")
        .populate("accessUsers", "name")
        .populate("dealVisibleTo", "name")
        .sort({ name: 1 })
        .lean();
}

export async function loadVisibleClient(user, id) {
    validate(objectId, id);
    const [client] = await findClientsWithRefs({ $and: [{ _id: id }, clientFilterFor(user)] });
    if (!client) throw new HttpError(404, "Client not found.");
    return client;
}

// Every picked user must exist and be active
export async function assertActiveUsers(ids = []) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return;
    const count = await User.countDocuments({ _id: { $in: unique }, isActive: true });
    if (count !== unique.length) throw new HttpError(400, "One of the selected people isn't an active user.");
}

// Throws unless the user can see this client (or clientId is empty)
export async function assertClientAccess(user, clientId) {
    if (!clientId) return;
    const ok = await Client.exists({ $and: [{ _id: clientId }, clientFilterFor(user)] });
    if (!ok) throw new HttpError(400, "You don't have access to that client.");
}