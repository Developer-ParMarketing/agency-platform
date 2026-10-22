import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import ProjectDetail from "@/components/projects/ProjectDetail";

export default async function ProjectPage({ params }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const { id } = await params;

    return <ProjectDetail projectId={id} me={{ id: user.id, role: user.role, team: user.team }} />;
}