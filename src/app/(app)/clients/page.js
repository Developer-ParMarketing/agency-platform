import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import ClientsList from "@/components/clients/ClientsList";

export default async function ClientsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <ClientsList canCreate={can(user, "clients.create")} />;
}