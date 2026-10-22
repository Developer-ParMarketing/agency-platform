import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export async function getCurrentUser() {
    const session = await auth();
    if (!session?.user?.id) return null;

    await connectDB();
    const user = await User.findById(session.user.id).lean();
    if (!user || !user.isActive) return null;

    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        team: user.team ? user.team.toString() : null,
        manager: user.manager ? user.manager.toString() : null,
        designation: user.designation,
    };
}

export async function requireUser() {
    const user = await getCurrentUser();
    if (!user) throw new HttpError(401, "Please log in.");
    return user;
}

export function requireRole(user, ...roles) {
    if (!roles.includes(user.role)) throw new HttpError(403, "You don't have permission for this.");
}

export function handleApiError(err) {
    if (err instanceof HttpError) {
        return Response.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return Response.json({ error: "Something went wrong." }, { status: 500 });
}