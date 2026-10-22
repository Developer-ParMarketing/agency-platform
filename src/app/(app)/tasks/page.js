import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import TasksBoard from "@/components/tasks/TasksBoard";

export default async function TasksPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <TasksBoard me={{ id: user.id, role: user.role, team: user.team }} />;
}