import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import MeetingsList from "@/components/meetings/MeetingsList";

export default async function MeetingsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    return <MeetingsList />;
}