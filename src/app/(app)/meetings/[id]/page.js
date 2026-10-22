import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import MeetingDetail from "@/components/meetings/MeetingDetail";

export default async function MeetingPage({ params }) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    const { id } = await params;
    return <MeetingDetail meetingId={id} />;
}