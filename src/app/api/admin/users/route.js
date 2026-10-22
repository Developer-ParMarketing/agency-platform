import bcrypt from "bcryptjs";
import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, createUserSchema } from "@/lib/validation";
import { toUserDTO } from "@/lib/serializers";
import { assertValidRelations, syncTeamManagers, findUsersWithRefs } from "@/services/users";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
    try {
        const me = await requireUser();
        requirePermission(me, "users.manage", HttpError);
        await connectDB();
        const users = await findUsersWithRefs();
        return Response.json({ users: users.map(toUserDTO) });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    try {
        const me = await requireUser();
        requirePermission(me, "users.manage", HttpError);

        const data = validate(createUserSchema, await request.json());
        await connectDB();

        if (await User.exists({ email: data.email })) {
            throw new HttpError(409, "A user with this email already exists.");
        }

        const team = data.team ?? null;
        const manager = data.manager ?? null;
        await assertValidRelations({ role: data.role, team, manager });

        const created = await User.create({
            name: data.name,
            email: data.email,
            passwordHash: await bcrypt.hash(data.password, 12),
            role: data.role,
            team,
            manager,
            designation: data.designation,
            phone: data.phone,
        });

        await syncTeamManagers(created._id.toString(), created.role, team);

        const [user] = await findUsersWithRefs({ _id: created._id });
        return Response.json({ user: toUserDTO(user) }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}