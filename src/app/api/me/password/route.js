import bcrypt from "bcryptjs";
import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { validate, changePasswordSchema } from "@/lib/validation";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(request) {
    try {
        const me = await requireUser();
        const { currentPassword, newPassword } = validate(changePasswordSchema, await request.json());

        await connectDB();
        const user = await User.findById(me.id).select("+passwordHash");
        const valid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!valid) throw new HttpError(400, "Your current password is incorrect.");

        await User.updateOne(
            { _id: me.id },
            { passwordHash: await bcrypt.hash(newPassword, 12), failedLoginAttempts: 0, lockUntil: null }
        );
        return Response.json({ ok: true });
    } catch (err) {
        return handleApiError(err);
    }
}