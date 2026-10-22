import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { buildDashboard } from "@/services/dashboard";
import { connectDB } from "@/lib/db";

export async function GET() {
    try {
        const me = await requireUser();
        await connectDB();
        return Response.json(await buildDashboard(me));
    } catch (err) {
        return handleApiError(err);
    }
}