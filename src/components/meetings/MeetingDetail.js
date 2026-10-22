"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MeetingForm from "./MeetingForm";
import { StatusBadge } from "@/components/ui/Badge";
import { useMeetingFormData } from "@/lib/use-meeting-form-data";
import { formatDate, formatDateTime } from "@/lib/format";

const card = "space-y-2 rounded-xl border bg-white p-5";

export default function MeetingDetail({ meetingId }) {
    const [meeting, setMeeting] = useState(null);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [pickFor, setPickFor] = useState(null); // action item id waiting for a project choice
    const [pickProject, setPickProject] = useState("");
    const [busyItem, setBusyItem] = useState(null);
    const { formData, ensureFormData } = useMeetingFormData();

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/meetings/${meetingId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setMeeting(data.meeting);
        } catch (e) {
            setError(e.message || "Failed to load meeting.");
        }
    }, [meetingId]);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        await ensureFormData();
        setShowForm(true);
    }

    async function createTask(item, project) {
        if (!meeting.project && !project) {
            await ensureFormData();
            setPickFor(item.id);
            return;
        }
        setBusyItem(item.id);
        const res = await fetch(`/api/meetings/${meetingId}/action-items/${item.id}/task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(project ? { project } : {}),
        });
        const data = await res.json();
        setBusyItem(null);
        if (!res.ok) return alert(data.error);
        setMeeting(data.meeting);
        setPickFor(null);
        setPickProject("");
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                <Link href="/meetings" className="text-sm text-indigo-600 hover:underline">← Back to meetings</Link>
            </div>
        );
    }
    if (!meeting) return <p className="text-gray-500">Loading...</p>;

    const sections = [
        ["Agenda", meeting.agenda],
        ["Discussion notes", meeting.notes],
        ["Decisions", meeting.decisions],
    ];

    return (
        <div className="max-w-5xl space-y-6">
            <Link href={meeting.client ? `/clients/${meeting.client.id}` : "/meetings"} className="text-sm text-indigo-600 hover:underline">
                ← {meeting.client ? meeting.client.name : "Back to meetings"}
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-gray-900">{meeting.title}</h1>
                    <p className="text-sm text-gray-500">
                        {formatDateTime(meeting.date)}
                        {meeting.client && <> · <Link href={`/clients/${meeting.client.id}`} className="text-indigo-600 hover:underline">{meeting.client.name}</Link></>}
                        {meeting.project && <> · <Link href={`/projects/${meeting.project.id}`} className="text-indigo-600 hover:underline">{meeting.project.name}</Link></>}
                        {" · "}Recorded by {meeting.createdBy?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                        Attendees: {meeting.attendees.map((a) => a.name).join(", ") || "—"}
                        {meeting.externalAttendees && ` · Client side: ${meeting.externalAttendees}`}
                    </p>
                </div>
                {meeting.permissions.canEdit && (
                    <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Edit
                    </button>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {sections.map(([title, text]) => (
                    <div key={title} className={card}>
                        <h2 className="font-semibold text-gray-900">{title}</h2>
                        <p className="whitespace-pre-line text-sm text-gray-700">{text || "—"}</p>
                    </div>
                ))}
            </div>

            <div className={card}>
                <h2 className="font-semibold text-gray-900">Action items</h2>
                {meeting.actionItems.length === 0 && <p className="text-sm text-gray-500">No action items.</p>}
                <div className="divide-y">
                    {meeting.actionItems.map((a) => (
                        <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                            <div>
                                <p className="text-sm text-gray-900">{a.text}</p>
                                <p className="text-xs text-gray-500">
                                    {a.assignee?.name || "No owner"}{a.dueDate && ` · due ${formatDate(a.dueDate)}`}
                                </p>
                            </div>

                            {a.task ? (
                                <Link href={`/tasks/${a.task.id}`} className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                                    View task <StatusBadge status={a.task.status} />
                                </Link>
                            ) : meeting.permissions.canCreateTasks ? (
                                pickFor === a.id ? (
                                    <div className="flex items-center gap-2">
                                        <select value={pickProject} onChange={(e) => setPickProject(e.target.value)}
                                            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                                            <option value="">Choose project</option>
                                            {(formData?.projects || []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <button disabled={!pickProject || busyItem === a.id} onClick={() => createTask(a, pickProject)}
                                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white disabled:opacity-60">Create</button>
                                        <button onClick={() => setPickFor(null)} className="text-sm text-gray-500">Cancel</button>
                                    </div>
                                ) : (
                                    <button disabled={busyItem === a.id} onClick={() => createTask(a)}
                                        className="rounded-lg border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                                        {busyItem === a.id ? "Creating..." : "Create task"}
                                    </button>
                                )
                            ) : (
                                <span className="text-xs text-gray-400">No task yet</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {showForm && formData && (
                <MeetingForm
                    meeting={meeting}
                    clients={formData.clients}
                    projects={formData.projects}
                    users={formData.users}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setMeeting(saved);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}