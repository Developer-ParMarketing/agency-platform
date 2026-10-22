import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { navForRole } from "@/lib/navigation";
import SidebarNav from "./SidebarNav";

export default async function Sidebar() {
    const user = await getCurrentUser();
    if (!user) redirect("/login"); // deactivated or deleted users get logged out

    return (
        <aside className="w-64 shrink-0 bg-white border-r flex flex-col">
            <div className="h-16 flex items-center px-6 border-b">
                <span className="text-lg font-semibold text-indigo-600">Agency Platform</span>
            </div>
            <SidebarNav items={navForRole(user.role)} />
        </aside>
    );
}