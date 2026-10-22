"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ProjectForm from "./ProjectForm";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { PROJECT_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { formatDate, isOverdue } from "@/lib/format";

export default function ProjectsList({ me, canCreate }) {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [clients, setClients] = useState([]);
    const [status, setStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async (statusFilter) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects${statusFilter ? `?status=${statusFilter}` : ""}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setProjects(data.projects);
            setError("");
        } catch (e) {
            setError(e.message || "Failed to load projects.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(status);
    }, [load, status]);

    async function openForm() {
        if (!users.length) {
            const [uRes, tRes, cRes] = await Promise.all([fetch("/api/users"), fetch("/api/teams"), fetch("/api/clients")]);
            setUsers((await uRes.json()).users || []);
            setTeams((await tRes.json()).teams || []);
            setClients((await cRes.json()).clients || []);
        }
        setShowForm(true);
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
                    <p className="text-sm text-gray-500">{projects.length} projects</p>
                </div>
                {canCreate && (
                    <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        + New project
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {["", ...PROJECT_STATUSES].map((s) => (
                    <button
                        key={s || "all"}
                        onClick={() => setStatus(s)}
                        className={`rounded-full px-3 py-1 text-sm ${status === s ? "bg-indigo-600 text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}
                    >
                        {s ? STATUS_LABELS[s] : "All"}
                    </button>
                ))}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {loading && <p className="text-gray-500">Loading...</p>}
            {!loading && projects.length === 0 && (
                <div className="rounded-xl border border-dashed bg-white p-10 text-center text-gray-500">No projects here yet.</div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => {
                    const overdue = isOverdue(p.dueDate, p.status);
                    return (
                        <Link key={p.id} href={`/projects/${p.id}`} className="block space-y-4 rounded-xl border bg-white p-5 hover:border-indigo-300 hover:shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-gray-900">{p.name}</h2>
                                    {p.client && <p className="text-xs text-gray-500">{p.client.name}</p>}
                                </div>
                                <StatusBadge status={p.status} />
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <PriorityBadge priority={p.priority} />
                                {p.teams.map((t) => (
                                    <span key={t.id} className="inline-flex items-center gap-1 text-xs text-gray-600">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                                        {t.name}
                                    </span>
                                ))}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{p.progress.done}/{p.progress.total} tasks done</span>
                                    <span>{p.progress.percent}%</span>
                                </div>
                                <ProgressBar percent={p.progress.percent} />
                            </div>

                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Lead: {p.managers.map((m) => m.name).join(", ") || "—"}</span>
                                <span className={overdue ? "font-medium text-red-600" : ""}>
                                    {overdue ? "Overdue · " : "Due "}{formatDate(p.dueDate)}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {showForm && (
                <ProjectForm
                    users={users}
                    teams={teams}
                    me={me}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setProjects((prev) => [saved, ...prev]);
                        setShowForm(false);
                    }}
                    clients={clients}
                />
            )}
        </div>
    );
}