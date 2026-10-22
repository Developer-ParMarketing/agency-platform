import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import AssetDetail from "@/components/assets/AssetDetail";

export default async function AssetPage({ params }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const { id } = await params;
    return <AssetDetail assetId={id} me={{ id: user.id, role: user.role, team: user.team }} />;
}