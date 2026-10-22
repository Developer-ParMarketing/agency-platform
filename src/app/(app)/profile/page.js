import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import User from "@/models/User";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

export default async function ProfilePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    await connectDB();
    const [team, manager] = await Promise.all([
        user.team ? Team.findById(user.team, "name").lean() : null,
        user.manager ? User.findById(user.manager, "name").lean() : null,
    ]);

    const details = [
        ["Name", user.name],
        ["Email", user.email],
        ["Role", user.role],
        ["Designation", user.designation || "—"],
        ["Team", team?.name || "—"],
        ["Reports to", manager?.name || "—"],
    ];

    return (
        <div className="max-w-2xl space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">My profile</h1>

            <div className="rounded-xl border bg-white p-6">
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {details.map(([label, value]) => (
                        <div key={label}>
                            <dt className="text-sm text-gray-500">{label}</dt>
                            <dd className="font-medium capitalize-first text-gray-900">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            <ChangePasswordForm />
        </div>
    );
}