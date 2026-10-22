"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import MeetingForm from "./MeetingForm";
import { useMeetingFormData } from "@/lib/use-meeting-form-data";
import { formatDateTime } from "@/lib/format";

export default function MeetingsList({ clientId = null, compact = false }) {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { formData, ensureFormData } = useMeetingFormData();

    const load = useCallback(async () => {
        const res = await fetch(`/api/meetings${clientId ? `?client=${clientId}` : ""}`);
        const data = await res.json();
        if (res.ok) setMeetings(data.meetings);
        setLoading(false);
    }, [clientId]);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        await ensureFormData();
        setShowForm(true);
    }

    return (
        <div className={compact ? "space-y-3 rounded-xl border bg-white p-5" : "space-y-5"}>
            <div className="flex items-center justify-between">
                {compact ? (
                    <h2 className="font-semibold text-gray-900">Meetings</h2>
                ) : (
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Meetings</h1>
                        <p className="text-sm text-gray-500">{meetings.length} meetings</p>
                    </div>
                )}
                <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    + New meeting
                </button>
            </div>

            {loading && <p className="text-sm text-gray-500">Loading...</p>}
            {!loading && meetings.length === 0 && <p className="text-sm text-gray-500">No meetings recorded yet.</p>}

            <div className={compact ? "space-y-2" : "overflow-hidden rounded-xl border bg-white divide-y"}>
                {meetings.map((m) => {
                    const total = m.actionItems.length;
                    const done = m.actionItems.filter((a) => a.task?.status === "done").length;
                    const pending = m.actionItems.filter((a) => !a.task).length;
                    return (
                        <Link key={m.id} href={`/meetings/${m.id}`}
                            className={`block ${compact ? "rounded-lg border p-3" : "p-4"} hover:bg-gray-50`}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="font-medium text-gray-900">{m.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatDateTime(m.date)}
                                        {!clientId && m.client && ` · ${m.client.name}`}
                                        {m.project && ` · ${m.project.name}`}
                                    </p>
                                </div>
                                {total > 0 && (
                                    <span className="text-xs text-gray-600">
                                        {done}/{total} action items done
                                        {pending > 0 && <span className="text-amber-700"> · {pending} without task</span>}
                                    </span>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>

            {showForm && formData && (
                <MeetingForm
                    clients={formData.clients}
                    projects={formData.projects}
                    users={formData.users}
                    defaultClient={clientId}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setMeetings((prev) => [saved, ...prev]);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}