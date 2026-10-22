"use client";

import { useCallback, useEffect, useState } from "react";
import TeamForm from "./TeamForm";

export default function TeamsManager() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formMode, setFormMode] = useState(null); // null | "create" | team object

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/teams");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTeams(data.teams);
            setError("");
        } catch (e) {
            setError(e.message || "Failed to load teams.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    function handleSaved(saved) {
        setTeams((prev) =>
            prev.some((t) => t.id === saved.id) ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]
        );
        setFormMode(null);
    }

    async function toggleActive(team) {
        const action = team.isActive ? "deactivate" : "activate";
        if (!confirm(`Are you sure you want to ${action} ${team.name}?`)) return;

        const res = await fetch(`/api/admin/teams/${team.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !team.isActive }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error);
        handleSaved(data.team);
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
                    <p className="text-sm text-gray-500">{teams.filter((t) => t.isActive).length} active teams</p>
                </div>
                <button
                    onClick={() => setFormMode("create")}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    + Add team
                </button>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {loading && <p className="text-gray-500">Loading...</p>}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {teams.map((team) => (
                    <div
                        key={team.id}
                        className={`overflow-hidden rounded-xl border bg-white ${team.isActive ? "" : "opacity-50"}`}
                    >
                        <div className="h-1.5" style={{ backgroundColor: team.color }} />
                        <div className="space-y-4 p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="font-semibold text-gray-900">{team.name}</h2>
                                    {team.description && <p className="mt-0.5 text-sm text-gray-500">{team.description}</p>}
                                    {!team.isActive && <p className="mt-1 text-xs font-medium text-gray-500">Inactive</p>}
                                </div>
                                <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
                                    {team.activeCount} active
                                </span>
                            </div>

                            <div className="text-sm">
                                <p className="text-gray-500">Manager</p>
                                <p className="font-medium text-gray-900">
                                    {team.managers.length ? team.managers.map((m) => m.name).join(", ") : "Not assigned"}
                                </p>
                            </div>

                            <div className="text-sm">
                                <p className="mb-1 text-gray-500">Members</p>
                                {team.members.length === 0 ? (
                                    <p className="text-gray-400">No members yet</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {team.members.map((m) => (
                                            <li key={m.id} className={`flex justify-between gap-2 ${m.isActive ? "" : "text-gray-400 line-through"}`}>
                                                <span className="text-gray-800">{m.name}</span>
                                                <span className="text-xs capitalize text-gray-500">{m.designation || m.role}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex gap-4 border-t pt-3 text-sm">
                                <button onClick={() => setFormMode(team)} className="text-indigo-600 hover:underline">
                                    Edit
                                </button>
                                <button onClick={() => toggleActive(team)} className="text-gray-600 hover:underline">
                                    {team.isActive ? "Deactivate" : "Activate"}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {formMode && (
                <TeamForm
                    team={formMode === "create" ? null : formMode}
                    onClose={() => setFormMode(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}