import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import AssetsBoard from "@/components/assets/AssetsBoard";

export default async function AssetsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <AssetsBoard me={{ id: user.id, role: user.role, team: user.team }} />;
}