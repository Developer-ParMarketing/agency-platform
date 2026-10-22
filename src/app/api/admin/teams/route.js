import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, createTeamSchema } from "@/lib/validation";
import { listTeamsWithMembers, findTeamByName } from "@/services/teams";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function GET() {
    try {
        const me = await requireUser();
        requirePermission(me, "teams.manage", HttpError);
        await connectDB();
        return Response.json({ teams: await listTeamsWithMembers() });
    } catch (err) {
        return handleApiError(err);
    }
}

export async function POST(request) {
    try {
        const me = await requireUser();
        requirePermission(me, "teams.manage", HttpError);
        const data = validate(createTeamSchema, await request.json());

        await connectDB();
        if (await findTeamByName(data.name)) {
            throw new HttpError(409, "A team with this name already exists.");
        }

        const created = await Team.create(data);
        const [team] = await listTeamsWithMembers({ _id: created._id });
        return Response.json({ team }, { status: 201 });
    } catch (err) {
        return handleApiError(err);
    }
}