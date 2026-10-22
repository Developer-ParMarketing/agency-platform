"use client";

import { useState } from "react";
import MultiSelect from "@/components/ui/MultiSelect";
import { PROJECT_STATUSES, PRIORITIES, STATUS_LABELS } from "@/lib/constants";
import { toInputDate } from "@/lib/format";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";

export default function ProjectForm({ project, users, teams, me, onClose, onSaved }) {
    const isEdit = !!project;
    const [form, setForm] = useState({
        name: project?.name || "",
        description: project?.description || "",
        status: project?.status || "planning",
        priority: project?.priority || "medium",
        startDate: toInputDate(project?.startDate),
        dueDate: toInputDate(project?.dueDate),
        teams: project?.teams.map((t) => t.id) || (me.team ? [me.team] : []),
        managers: project?.managers.map((m) => m.id) || (me.role === "manager" ? [me.id] : []),
        members: project?.members.map((m) => m.id) || [],
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const setList = (key) => (list) => setForm((f) => ({ ...f, [key]: list }));

    const teamOptions = teams.map((t) => ({ id: t.id, label: t.name }));
    const leadOptions = users
        .filter((u) => u.role === "manager" || u.role === "admin")
        .map((u) => ({ id: u.id, label: u.name, sublabel: u.team?.name || u.role }));
    const memberOptions = users.map((u) => ({ id: u.id, label: u.name, sublabel: u.team?.name || u.role }));

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch(isEdit ? `/api/projects/${project.id}` : "/api/projects", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved(data.project);
        } catch (err) {
            setError(err.message || "Could not save project.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit project" : "New project"}</h2>

                <div className="space-y-1">
                    <label className={label}>Project name</label>
                    <input className={input} value={form.name} onChange={set("name")} required />
                </div>

                <div className="space-y-1">
                    <label className={label}>Description</label>
                    <textarea className={input} rows={3} value={form.description} onChange={set("description")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={label}>Status</label>
                        <select className={input} value={form.status} onChange={set("status")}>
                            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Priority</label>
                        <select className={input} value={form.priority} onChange={set("priority")}>
                            {PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Start date</label>
                        <input type="date" className={input} value={form.startDate} onChange={set("startDate")} />
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Due date</label>
                        <input type="date" className={input} value={form.dueDate} onChange={set("dueDate")} />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className={label}>Teams involved</label>
                    <MultiSelect options={teamOptions} value={form.teams} onChange={setList("teams")} placeholder="Search teams" />
                </div>

                <div className="space-y-1">
                    <label className={label}>Project leads</label>
                    <MultiSelect options={leadOptions} value={form.managers} onChange={setList("managers")} placeholder="Search managers" />
                    {me.role === "manager" && <p className="text-xs text-gray-500">You're always included as a lead on projects you create.</p>}
                </div>

                <div className="space-y-1">
                    <label className={label}>Other members (can see the whole project)</label>
                    <MultiSelect options={memberOptions} value={form.members} onChange={setList("members")} placeholder="Search people" />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create project"}
                    </button>
                </div>
            </form>
        </div>
    );
}