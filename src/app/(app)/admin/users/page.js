import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import UsersManager from "@/components/admin/UsersManager";

export default async function UsersPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!can(user, "users.manage")) redirect("/dashboard");

    return <UsersManager currentUserId={user.id} />;
}