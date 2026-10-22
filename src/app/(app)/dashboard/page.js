import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import DashboardView from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <DashboardView me={{ name: user.name, role: user.role }} />;
}