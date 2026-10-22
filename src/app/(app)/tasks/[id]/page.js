import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import TaskDetail from "@/components/tasks/TaskDetail";

export default async function TaskPage({ params }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const { id } = await params;
    return <TaskDetail taskId={id} me={{ id: user.id, role: user.role, team: user.team }} />;
}