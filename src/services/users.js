import { HttpError } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";
import User from "@/models/User";
import Team from "@/models/Team";

export async function assertValidRelations({ role, team, manager, userId }) {
    if (role === ROLES.MEMBER && !team) {
        throw new HttpError(400, "A team member must belong to a team.");
    }
    if (team) {
        const t = await Team.findById(team).lean();
        if (!t || !t.isActive) throw new HttpError(400, "Selected team doesn't exist.");
    }
    if (manager) {
        if (userId && manager === userId) throw new HttpError(400, "A user can't be their own manager.");
        const m = await User.findById(manager).lean();
        if (!m || !m.isActive || ![ROLES.ADMIN, ROLES.MANAGER].includes(m.role)) {
            throw new HttpError(400, "Selected manager must be an active manager or admin.");
        }
    }
}

// Keeps Team.managers in sync with users who have role "manager"
export async function syncTeamManagers(userId, role, team) {
    await Team.updateMany({ managers: userId }, { $pull: { managers: userId } });
    if (role === ROLES.MANAGER && team) {
        await Team.updateOne({ _id: team }, { $addToSet: { managers: userId } });
    }
}

export function findUsersWithRefs(filter = {}) {
    return User.find(filter).populate("team", "name").populate("manager", "name").sort({ createdAt: -1 }).lean();
}