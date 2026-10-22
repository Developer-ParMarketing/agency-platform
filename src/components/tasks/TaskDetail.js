"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import TaskForm from "./TaskForm";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { TASK_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDate, formatDateTime, isOverdue } from "@/lib/format";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function TaskDetail({ taskId, me }) {
    const [task, setTask] = useState(null);
    const [updates, setUpdates] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [progress, setProgress] = useState({ note: "", hoursSpent: "", status: "" });
    const [posting, setPosting] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/tasks/${taskId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTask(data.task);
            setUpdates(data.updates);
        } catch (e) {
            setError(e.message || "Failed to load task.");
        }
    }, [taskId]);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        if (!users.length) setUsers((await (await fetch("/api/users")).json()).users || []);
        setShowForm(true);
    }

    async function changeStatus(status) {
        const res = await fetch(`/api/tasks/${taskId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error);
        load(); // reload so the status change appears in the timeline
    }

    async function postProgress(e) {
        e.preventDefault();
        setPosting(true);
        const body = { note: progress.note, hoursSpent: progress.hoursSpent || 0 };
        if (progress.status) body.status = progress.status;

        const res = await fetch(`/api/tasks/${taskId}/updates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        setPosting(false);
        if (!res.ok) return alert(data.error);

        setTask(data.task);
        setUpdates((prev) => [data.update, ...prev]);
        setProgress({ note: "", hoursSpent: "", status: "" });
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                <Link href="/tasks" className="text-sm text-indigo-600 hover:underline">← Back to tasks</Link>
            </div>
        );
    }
    if (!task) return <p className="text-gray-500">Loading...</p>;

    const overdue = isOverdue(task.dueDate, task.status);
    const info = [
        ["Assigned to", task.assignedTo?.name],
        ["Assigned by", task.assignedBy?.name],
        ["Team", task.team?.name || "—"],
        ["Start", formatDate(task.startDate)],
        ["Due", `${formatDate(task.dueDate)}${overdue ? " (overdue)" : ""}`],
        ["Hours", `${task.loggedHours} logged / ${task.estimatedHours || "—"} estimated`],
        ["Completed", task.completedAt ? formatDateTime(task.completedAt) : "—"],
    ];

    return (
        <div className="max-w-4xl space-y-6">
            <Link href={`/projects/${task.project.id}`} className="text-sm text-indigo-600 hover:underline">
                ← {task.project.name}
            </Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
                        <StatusBadge status={task.status} />
                        <PriorityBadge priority={task.priority} />
                    </div>
                    {task.description && <p className="whitespace-pre-line text-gray-600">{task.description}</p>}
                </div>

                <div className="flex items-center gap-2">
                    {task.permissions.canChangeStatus && (
                        <select value={task.status} onChange={(e) => changeStatus(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                            {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                    )}
                    {task.permissions.canEdit && (
                        <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border bg-white p-5 sm:grid-cols-4">
                {info.map(([title, value]) => (
                    <div key={title}>
                        <p className="text-xs text-gray-500">{title}</p>
                        <p className={`text-sm ${title === "Due" && overdue ? "font-medium text-red-600" : "text-gray-900"}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Progress</h2>

                {task.permissions.canAddUpdate && (
                    <form onSubmit={postProgress} className="space-y-3 rounded-xl border bg-white p-5">
                        <textarea className={input} rows={3} placeholder="What did you work on?" value={progress.note}
                            onChange={(e) => setProgress((p) => ({ ...p, note: e.target.value }))} required />
                        <div className="flex flex-wrap items-center gap-3">
                            <input type="number" min="0" max="24" step="0.5" placeholder="Hours" className={`${input} w-28`}
                                value={progress.hoursSpent} onChange={(e) => setProgress((p) => ({ ...p, hoursSpent: e.target.value }))} />
                            <select className={`${input} w-48`} value={progress.status}
                                onChange={(e) => setProgress((p) => ({ ...p, status: e.target.value }))}>
                                <option value="">Keep status</option>
                                {TASK_STATUSES.map((s) => <option key={s} value={s}>Move to {STATUS_LABELS[s]}</option>)}
                            </select>
                            <button type="submit" disabled={posting}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                                {posting ? "Posting..." : "Add update"}
                            </button>
                        </div>
                    </form>
                )}

                {updates.length === 0 && <p className="text-sm text-gray-500">No updates yet.</p>}

                <ol className="space-y-3">
                    {updates.map((u) => (
                        <li key={u.id} className="rounded-xl border bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                                <span className="font-medium text-gray-900">{u.user?.name}</span>
                                <span className="text-xs text-gray-500">{formatDateTime(u.createdAt)}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-line text-sm text-gray-700">{u.note}</p>
                            <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                {u.hoursSpent > 0 && <span>{u.hoursSpent}h logged</span>}
                                {u.statusTo && (
                                    <span>
                                        {STATUS_LABELS[u.statusFrom] || u.statusFrom} → <strong>{STATUS_LABELS[u.statusTo]}</strong>
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

            {showForm && (
                <TaskForm
                    task={task}
                    users={users}
                    me={me}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setTask(saved);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}