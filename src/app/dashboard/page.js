import { Suspense } from "react";
import { auth, signOut } from "@/auth";

async function Welcome() {
    const session = await auth();
    const user = session?.user;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-semibold">Welcome, {user?.name}</h1>
            <p className="text-gray-600">Email: {user?.email}</p>
            <p className="text-gray-600">Role: {user?.role}</p>

            <form
                action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                }}
            >
                <button className="rounded-lg bg-gray-900 px-4 py-2 text-white">Sign out</button>
            </form>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <main className="p-8">
            <Suspense fallback={<p>Loading...</p>}>
                <Welcome />
            </Suspense>
        </main>
    );
}