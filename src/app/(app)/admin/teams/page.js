import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import TeamsManager from "@/components/admin/TeamsManager";

export default async function TeamsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!can(user, "teams.manage")) redirect("/dashboard");

    return <TeamsManager />;
}