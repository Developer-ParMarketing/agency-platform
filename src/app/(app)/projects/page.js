import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import ProjectsList from "@/components/projects/ProjectsList";

export default async function ProjectsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    return (
        <ProjectsList
            me={{ id: user.id, role: user.role, team: user.team }}
            canCreate={can(user, "projects.create")}
        />
    );
}