import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function GET() {
    try {
        await requireUser();
        await connectDB();
        const users = await User.find({ isActive: true }, "name role team manager designation")
            .populate("team", "name")
            .sort({ name: 1 })
            .lean();

        return Response.json({
            users: users.map((u) => ({
                id: u._id.toString(),
                name: u.name,
                role: u.role,
                designation: u.designation || "",
                team: u.team ? { id: u.team._id.toString(), name: u.team.name } : null,
                manager: u.manager ? u.manager.toString() : null,
            })),
        });
    } catch (err) {
        return handleApiError(err);
    }
}