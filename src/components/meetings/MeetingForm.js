"use client";

import { useState } from "react";
import MultiSelect from "@/components/ui/MultiSelect";
import { toInputDate, toInputDateTime } from "@/lib/format";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";

export default function MeetingForm({ meeting, clients, projects, users, defaultClient, onClose, onSaved }) {
    const isEdit = !!meeting;
    const [form, setForm] = useState({
        title: meeting?.title || "",
        date: toInputDateTime(meeting?.date || new Date()),
        client: meeting?.client?.id || defaultClient || "",
        project: meeting?.project?.id || "",
        externalAttendees: meeting?.externalAttendees || "",
        agenda: meeting?.agenda || "",
        notes: meeting?.notes || "",
        decisions: meeting?.decisions || "",
    });
    const [attendees, setAttendees] = useState(meeting?.attendees.map((a) => a.id) || []);
    const [items, setItems] = useState(
        meeting?.actionItems.map((a) => ({
            id: a.id,
            text: a.text,
            assignee: a.assignee?.id || "",
            dueDate: toInputDate(a.dueDate),
            hasTask: !!a.task,
        })) || []
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const setItem = (i, key) => (e) => setItems((list) => list.map((it, j) => (j === i ? { ...it, [key]: e.target.value } : it)));

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
            ...form,
            date: new Date(form.date).toISOString(), // browser local time → UTC
            attendees,
            actionItems: items
                .filter((it) => it.text.trim())
                .map(({ hasTask, ...it }) => it),
        };

        try {
            const res = await fetch(isEdit ? `/api/meetings/${meeting.id}` : "/api/meetings", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved(data.meeting);
        } catch (err) {
            setError(err.message || "Could not save meeting.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit meeting" : "New meeting"}</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <label className={label}>Title</label>
                        <input className={input} value={form.title} onChange={set("title")} placeholder="e.g. Monthly review with Surya Hospital" required />
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Date & time</label>
                        <input type="datetime-local" className={input} value={form.date} onChange={set("date")} required />
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Client</label>
                        <select className={input} value={form.client} onChange={set("client")}>
                            <option value="">No client (internal)</option>
                            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                        <label className={label}>Project (needed to turn action items into tasks)</label>
                        <select className={input} value={form.project} onChange={set("project")}>
                            <option value="">No project</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={label}>Our attendees</label>
                    <MultiSelect
                        options={users.map((u) => ({ id: u.id, label: u.name, sublabel: u.team?.name || u.role }))}
                        value={attendees}
                        onChange={setAttendees}
                        placeholder="Search people"
                    />
                </div>

                <div className="space-y-1">
                    <label className={label}>Client-side attendees</label>
                    <input className={input} value={form.externalAttendees} onChange={set("externalAttendees")} placeholder="e.g. Dr. Mehta, Ravi (marketing head)" />
                </div>

                <div className="space-y-1">
                    <label className={label}>Agenda</label>
                    <textarea className={input} rows={2} value={form.agenda} onChange={set("agenda")} />
                </div>
                <div className="space-y-1">
                    <label className={label}>Discussion notes</label>
                    <textarea className={input} rows={5} value={form.notes} onChange={set("notes")} />
                </div>
                <div className="space-y-1">
                    <label className={label}>Decisions</label>
                    <textarea className={input} rows={3} value={form.decisions} onChange={set("decisions")} />
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Action items</h3>
                        <button type="button" onClick={() => setItems((l) => [...l, { text: "", assignee: "", dueDate: "" }])}
                            className="text-sm text-indigo-600 hover:underline">+ Add action item</button>
                    </div>
                    {items.length === 0 && <p className="text-sm text-gray-400">No action items.</p>}
                    {items.map((it, i) => (
                        <div key={it.id || i} className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
                            <input className={input} placeholder="What needs to be done" value={it.text} onChange={setItem(i, "text")} />
                            <select className={input} value={it.assignee} onChange={setItem(i, "assignee")}>
                                <option value="">Owner</option>
                                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                            <input type="date" className={input} value={it.dueDate} onChange={setItem(i, "dueDate")} />
                            {it.hasTask ? (
                                <span className="self-center text-xs text-gray-400">Has task</span>
                            ) : (
                                <button type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))}
                                    className="text-sm text-gray-400 hover:text-red-600">Remove</button>
                            )}
                        </div>
                    ))}
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Save meeting"}
                    </button>
                </div>
            </form>
        </div>
    );
}