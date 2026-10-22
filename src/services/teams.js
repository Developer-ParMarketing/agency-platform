import Team from "@/models/Team";
import User from "@/models/User";

export async function listTeamsWithMembers(filter = {}) {
    const teams = await Team.find(filter).sort({ name: 1 }).lean();
    const users = await User.find(
        { team: { $in: teams.map((t) => t._id) } },
        "name role team designation isActive"
    )
        .sort({ name: 1 })
        .lean();

    return teams.map((t) => {
        const members = users
            .filter((u) => u.team.toString() === t._id.toString())
            .map((u) => ({
                id: u._id.toString(),
                name: u.name,
                role: u.role,
                designation: u.designation || "",
                isActive: u.isActive,
            }));

        return {
            id: t._id.toString(),
            name: t.name,
            description: t.description || "",
            color: t.color,
            isActive: t.isActive,
            managers: members.filter((m) => m.role === "manager" && m.isActive),
            members,
            activeCount: members.filter((m) => m.isActive).length,
        };
    });
}

export function findTeamByName(name) {
    // case-insensitive match, so "SEO" and "seo" count as the same team
    return Team.findOne({ name }).collation({ locale: "en", strength: 2 }).lean();
}