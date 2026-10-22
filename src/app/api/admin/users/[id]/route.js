import bcrypt from "bcryptjs";
import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, updateUserSchema, objectId } from "@/lib/validation";
import { toUserDTO } from "@/lib/serializers";
import { ROLES } from "@/lib/constants";
import { assertValidRelations, syncTeamManagers, findUsersWithRefs } from "@/services/users";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function PATCH(request, { params }) {
    try {
        const me = await requireUser();
        requirePermission(me, "users.manage", HttpError);

        const { id } = await params;
        validate(objectId, id);
        const data = validate(updateUserSchema, await request.json());

        await connectDB();
        const user = await User.findById(id);
        if (!user) throw new HttpError(404, "User not found.");

        if (id === me.id) {
            if (data.isActive === false) throw new HttpError(400, "You can't deactivate your own account.");
            if (data.role && data.role !== ROLES.ADMIN) throw new HttpError(400, "You can't remove your own admin role.");
        }

        const next = {
            role: data.role ?? user.role,
            team: data.team !== undefined ? data.team : user.team?.toString() ?? null,
            manager: data.manager !== undefined ? data.manager : user.manager?.toString() ?? null,
        };
        await assertValidRelations({ ...next, userId: id });

        const update = { role: next.role, team: next.team, manager: next.manager };
        for (const key of ["name", "designation", "phone", "isActive"]) {
            if (data[key] !== undefined) update[key] = data[key];
        }
        if (data.password) {
            update.passwordHash = await bcrypt.hash(data.password, 12);
            update.failedLoginAttempts = 0;
            update.lockUntil = null;
        }

        await User.updateOne({ _id: id }, { $set: update });
        await syncTeamManagers(id, next.role, next.team);

        const [updated] = await findUsersWithRefs({ _id: user._id });
        return Response.json({ user: toUserDTO(updated) });
    } catch (err) {
        return handleApiError(err);
    }
}