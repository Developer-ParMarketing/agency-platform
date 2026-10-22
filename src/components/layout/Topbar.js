import { getCurrentUser } from "@/lib/auth-helpers";
import { signOut } from "@/auth";

const ROLE_STYLES = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    member: "bg-gray-100 text-gray-700",
};

export default async function Topbar() {
    const user = await getCurrentUser();
    if (!user) return null;

    return (
        <header className="h-16 bg-white border-b flex items-center justify-end gap-4 px-6">
            <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[user.role]}`}>
                {user.role}
            </span>
            <form
                action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                }}
            >
                <button className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Sign out</button>
            </form>
        </header>
    );
}