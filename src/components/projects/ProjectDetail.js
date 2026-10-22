"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProjectForm from "./ProjectForm";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { TASK_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/format";

export default function ProjectDetail({ projectId, me }) {
    const [project, setProject] = useState(null);
    const [canEdit, setCanEdit] = useState(false);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setProject(data.project);
            setCanEdit(data.canEdit);
        } catch (e) {
            setError(e.message || "Failed to load project.");
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        if (!users.length) {
            const [uRes, tRes] = await Promise.all([fetch("/api/users"), fetch("/api/teams")]);
            setUsers((await uRes.json()).users || []);
            setTeams((await tRes.json()).teams || []);
        }
        setShowForm(true);
    }

    async function toggleArchive() {
        const action = project.isArchived ? "restore" : "archive";
        if (!confirm(`Are you sure you want to ${action} this project?`)) return;
        const res = await fetch(`/api/projects/${projectId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isArchived: !project.isArchived }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error);
        setProject(data.project);
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                <Link href="/projects" className="text-sm text-indigo-600 hover:underline">← Back to projects</Link>
            </div>
        );
    }
    if (!project) return <p className="text-gray-500">Loading...</p>;

    const overdue = isOverdue(project.dueDate, project.status);
    const people = [
        ["Teams", project.teams.map((t) => t.name)],
        ["Project leads", project.managers.map((m) => m.name)],
        ["Members", project.members.map((m) => m.name)],
    ];

    return (
        <div className="space-y-6">
            <Link href="/projects" className="text-sm text-indigo-600 hover:underline">← Back to projects</Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
                        <StatusBadge status={project.status} />
                        <PriorityBadge priority={project.priority} />
                        {project.isArchived && <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs text-gray-700">Archived</span>}
                    </div>
                    {project.description && <p className="max-w-2xl whitespace-pre-line text-gray-600">{project.description}</p>}
                    <p className="text-sm text-gray-500">
                        {formatDate(project.startDate)} → <span className={overdue ? "font-medium text-red-600" : ""}>{formatDate(project.dueDate)}{overdue && " (overdue)"}</span>
                        {" · "}Created by {project.createdBy?.name}
                    </p>
                </div>

                {canEdit && (
                    <div className="flex gap-2">
                        <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                            Edit
                        </button>
                        <button onClick={toggleArchive} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            {project.isArchived ? "Restore" : "Archive"}
                        </button>
                    </div>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 rounded-xl border bg-white p-5 lg:col-span-2">
                    <div className="flex items-end justify-between">
                        <h2 className="font-semibold text-gray-900">Progress</h2>
                        <span className="text-2xl font-semibold text-gray-900">{project.progress.percent}%</span>
                    </div>
                    <ProgressBar percent={project.progress.percent} />
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {TASK_STATUSES.map((s) => (
                            <div key={s} className="rounded-lg bg-gray-50 p-3 text-center">
                                <p className="text-lg font-semibold text-gray-900">{project.progress.byStatus[s] || 0}</p>
                                <p className="text-xs text-gray-500">{STATUS_LABELS[s]}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4 rounded-xl border bg-white p-5">
                    <h2 className="font-semibold text-gray-900">People</h2>
                    {people.map(([title, names]) => (
                        <div key={title}>
                            <p className="text-sm text-gray-500">{title}</p>
                            <p className="text-sm text-gray-900">{names.length ? names.join(", ") : "—"}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-dashed bg-white p-8 text-center text-gray-500">
                Tasks for this project will appear here (next step).
            </div>

            {showForm && (
                <ProjectForm
                    project={project}
                    users={users}
                    teams={teams}
                    me={me}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setProject(saved);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}