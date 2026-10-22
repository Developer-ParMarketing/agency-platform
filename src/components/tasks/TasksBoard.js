"use client";

import { useCallback, useEffect, useState } from "react";
import TaskTable from "./TaskTable";
import TaskForm from "./TaskForm";
import { TASK_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { isOverdue } from "@/lib/format";

function tabsFor(role) {
    const tabs = [{ key: "mine", label: "My tasks" }];
    if (role !== "member") tabs.push({ key: "assigned", label: "Assigned by me" });
    if (role === "manager") tabs.push({ key: "team", label: "My team" });
    tabs.push({ key: "all", label: role === "admin" ? "All tasks" : "All I can see" });
    return tabs;
}

export default function TasksBoard({ me }) {
    const tabs = tabsFor(me.role);
    const [tab, setTab] = useState("mine");
    const [status, setStatus] = useState("");
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async (scope) => {
        setLoading(true);
        const res = await fetch(`/api/tasks${scope === "all" ? "" : `?scope=${scope}`}`);
        const data = await res.json();
        if (res.ok) setTasks(data.tasks);
        setLoading(false);
    }, []);

    useEffect(() => {
        load(tab);
    }, [load, tab]);

    async function openForm() {
        if (!users.length) {
            const [uRes, pRes] = await Promise.all([fetch("/api/users"), fetch("/api/projects")]);
            setUsers((await uRes.json()).users || []);
            setProjects((await pRes.json()).projects || []);
        }
        setShowForm(true);
    }

    function upsert(task) {
        setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev]));
    }

    const visible = status ? tasks.filter((t) => t.status === status) : tasks;
    const open = tasks.filter((t) => t.status !== "done").length;
    const overdue = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
                    <p className="text-sm text-gray-500">
                        {open} open{overdue > 0 && <span className="font-medium text-red-600"> · {overdue} overdue</span>}
                    </p>
                </div>
                {me.role !== "member" && (
                    <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        + New task
                    </button>
                )}
            </div>

            <div className="flex gap-1 border-b">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
                <option value="">All statuses</option>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>

            {loading ? <p className="text-gray-500">Loading...</p> : <TaskTable tasks={visible} onTaskChange={upsert} showProject />}

            {showForm && (
                <TaskForm
                    projects={projects.filter((p) => !p.isArchived)}
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