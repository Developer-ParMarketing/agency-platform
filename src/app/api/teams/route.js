import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function GET() {
    try {
        await requireUser();
        await connectDB();
        const teams = await Team.find({ isActive: true }).sort({ name: 1 }).lean();
        return Response.json({
            teams: teams.map((t) => ({ id: t._id.toString(), name: t.name, color: t.color })),
        });
    } catch (err) {
        return handleApiError(err);
    }
}