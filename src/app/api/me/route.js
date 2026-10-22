import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";

export async function GET() {
    try {
        const user = await requireUser();
        return Response.json({
            user,
            permissions: {
                manageUsers: can(user, "users.manage"),
                approveAssets: can(user, "assets.approve"),
            },
        });
    } catch (err) {
        return handleApiError(err);
    }
}