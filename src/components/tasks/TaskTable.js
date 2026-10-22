"use client";

import Link from "next/link";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { TASK_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/format";

// Open tasks first, then by due date (no due date last)
function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
        const aDone = a.status === "done", bDone = b.status === "done";
        if (aDone !== bDone) return aDone ? 1 : -1;
        const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDue - bDue;
    });
}

export default function TaskTable({ tasks, onTaskChange, showProject = false }) {
    async function changeStatus(task, status) {
        const res = await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error);
        onTaskChange(data.task);
    }

    if (tasks.length === 0) {
        return <div className="rounded-xl border border-dashed bg-white p-8 text-center text-gray-500">No tasks here.</div>;
    }

    return (
        <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                        <th className="px-4 py-3 font-medium">Task</th>
                        <th className="px-4 py-3 font-medium">Assignee</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Priority</th>
                        <th className="px-4 py-3 font-medium">Due</th>
                        <th className="px-4 py-3 font-medium">Hours</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {sortTasks(tasks).map((t) => {
                        const overdue = isOverdue(t.dueDate, t.status);
                        return (
                            <tr key={t.id} className={t.status === "done" ? "text-gray-400" : ""}>
                                <td className="px-4 py-3">
                                    <Link href={`/tasks/${t.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                                        {t.title}
                                    </Link>
                                    {showProject && <p className="text-xs text-gray-500">{t.project?.name}</p>}
                                </td>
                                <td className="px-4 py-3 text-gray-700">{t.assignedTo?.name}</td>
                                <td className="px-4 py-3">
                                    {t.permissions.canChangeStatus ? (
                                        <select
                                            value={t.status}
                                            onChange={(e) => changeStatus(t, e.target.value)}
                                            className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs"
                                        >
                                            {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                                        </select>
                                    ) : (
                                        <StatusBadge status={t.status} />
                                    )}
                                </td>
                                <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                                <td className={`px-4 py-3 whitespace-nowrap ${overdue ? "font-medium text-red-600" : "text-gray-600"}`}>
                                    {formatDate(t.dueDate)}{overdue && " · overdue"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                    {t.loggedHours} / {t.estimatedHours || "—"}h
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}