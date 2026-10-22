"use client";

import { useState } from "react";
import { TASK_STATUSES, PRIORITIES, STATUS_LABELS } from "@/lib/constants";
import { toInputDate } from "@/lib/format";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";

// Who this user can assign to (the server checks this again)
function assignableUsers(users, me) {
    if (me.role === "admin") return users;
    return users.filter((u) => u.id === me.id || u.manager === me.id || (me.team && u.team?.id === me.team));
}

export default function TaskForm({ task, projectId, projects = [], users, me, onClose, onSaved }) {
    const isEdit = !!task;
    const [form, setForm] = useState({
        title: task?.title || "",
        description: task?.description || "",
        project: task?.project?.id || projectId || "",
        assignedTo: task?.assignedTo?.id || "",
        status: task?.status || "todo",
        priority: task?.priority || "medium",
        startDate: toInputDate(task?.startDate),
        dueDate: toInputDate(task?.dueDate),
        estimatedHours: task?.estimatedHours ?? "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const people = assignableUsers(users, me);

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = { ...form, estimatedHours: form.estimatedHours || 0 };
        if (isEdit) delete payload.project; // a task can't move to another project

        try {
            const res = await fetch(isEdit ? `/api/tasks/${task.id}` : "/api/tasks", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved(data.task);
        } catch (err) {
            setError(err.message || "Could not save task.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">{isEdit ? "Edit task" : "New task"}</h2>

                <div className="space-y-1">
                    <label className={label}>Title</label>
                    <input className={input} value={form.title} onChange={set("title")} required />
                </div>

                <div className="space-y-1">
                    <label className={label}>Description</label>
                    <textarea className={input} rows={4} value={form.description} onChange={set("description")} />
                </div>

                {!isEdit && !projectId && (
                    <div className="space-y-1">
                        <label className={label}>Project</label>
                        <select className={input} value={form.project} onChange={set("project")} required>
                            <option value="">Select a project</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-1">
                    <label className={label}>Assign to</label>
                    <select className={input} value={form.assignedTo} onChange={set("assignedTo")} required>
                        <option value="">Select a person</option>
                        {people.map((u) => (
                            <option key={u.id} value={u.id}>
                                {u.name}{u.team ? ` · ${u.team.name}` : ""}{u.id === me.id ? " (me)" : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className={label}>Priority</label>
                        <select className={input} value={form.priority} onChange={set("priority")}>
                            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Status</label>
                        <select className={input} value={form.status} onChange={set("status")}>
                            {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
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
                    <div className="space-y-1">
                        <label className={label}>Estimated hours</label>
                        <input type="number" min="0" step="0.5" className={input} value={form.estimatedHours} onChange={set("estimatedHours")} />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create task"}
                    </button>
                </div>
            </form>
        </div>
    );
}