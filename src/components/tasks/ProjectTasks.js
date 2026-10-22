"use client";

import { useCallback, useEffect, useState } from "react";
import TaskTable from "./TaskTable";
import TaskForm from "./TaskForm";
import { TASK_STATUSES, STATUS_LABELS } from "@/lib/constants";

export default function ProjectTasks({ projectId, me, canCreate, onChanged }) {
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async () => {
        const res = await fetch(`/api/tasks?project=${projectId}`);
        const data = await res.json();
        if (res.ok) setTasks(data.tasks);
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        if (!users.length) setUsers((await (await fetch("/api/users")).json()).users || []);
        setShowForm(true);
    }

    function upsert(task) {
        setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]));
        onChanged?.(); // refresh the project's progress card
    }

    const visible = status ? tasks.filter((t) => t.status === status) : tasks;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                {canCreate && (
                    <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        + Add task
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {["", ...TASK_STATUSES].map((s) => (
                    <button
                        key={s || "all"}
                        onClick={() => setStatus(s)}
                        className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-indigo-600 text-white" : "border bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                        {s ? STATUS_LABELS[s] : "All"} ({s ? tasks.filter((t) => t.status === s).length : tasks.length})
                    </button>
                ))}
            </div>

            {loading ? <p className="text-gray-500">Loading...</p> : <TaskTable tasks={visible} onTaskChange={upsert} />}

            {showForm && (
                <TaskForm
                    projectId={projectId}
                    users={users}
                    me={me}
                    onClose={() => setShowForm(false)}
                    onSaved={(task) => {
                        upsert(task);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}