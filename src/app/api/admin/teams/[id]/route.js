import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { requirePermission } from "@/lib/permissions";
import { validate, updateTeamSchema, objectId } from "@/lib/validation";
import { listTeamsWithMembers, findTeamByName } from "@/services/teams";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import User from "@/models/User";

export async function PATCH(request, { params }) {
    try {
        const me = await requireUser();
        requirePermission(me, "teams.manage", HttpError);

        const { id } = await params;
        validate(objectId, id);
        const data = validate(updateTeamSchema, await request.json());

        await connectDB();
        const team = await Team.findById(id);
        if (!team) throw new HttpError(404, "Team not found.");

        if (data.name && data.name.toLowerCase() !== team.name.toLowerCase()) {
            const clash = await findTeamByName(data.name);
            if (clash) throw new HttpError(409, "A team with this name already exists.");
        }

        if (data.isActive === false) {
            const activeMembers = await User.countDocuments({ team: id, isActive: true });
            if (activeMembers > 0) {
                throw new HttpError(
                    400,
                    `This team still has ${activeMembers} active member(s). Move them to another team first.`
                );
            }
        }

        await Team.updateOne({ _id: id }, { $set: data });
        const [updated] = await listTeamsWithMembers({ _id: team._id });
        return Response.json({ team: updated });
    } catch (err) {
        return handleApiError(err);
    }
}