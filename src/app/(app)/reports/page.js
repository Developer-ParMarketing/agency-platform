import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import ReportsView from "@/components/reports/ReportsView";

export default async function ReportsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <ReportsView me={{ id: user.id, role: user.role, team: user.team }} />;
}