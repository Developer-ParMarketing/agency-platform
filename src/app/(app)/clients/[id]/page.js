import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import ClientDetail from "@/components/clients/ClientDetail";

export default async function ClientPage({ params }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const { id } = await params;
    return <ClientDetail clientId={id} />;
}