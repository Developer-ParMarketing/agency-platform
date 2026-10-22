"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UserForm from "./UserForm";

const ROLE_STYLES = {
    admin: "bg-purple-100 text-purple-700",
    manager: "bg-blue-100 text-blue-700",
    member: "bg-gray-100 text-gray-700",
};

export default function UsersManager({ currentUserId }) {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [teamFilter, setTeamFilter] = useState("");
    const [formMode, setFormMode] = useState(null); // null | "create" | user object

    const load = useCallback(async () => {
        try {
            const [uRes, tRes] = await Promise.all([fetch("/api/admin/users"), fetch("/api/teams")]);
            const uData = await uRes.json();
            const tData = await tRes.json();
            if (!uRes.ok) throw new Error(uData.error);
            if (!tRes.ok) throw new Error(tData.error);
            setUsers(uData.users);
            setTeams(tData.teams);
            setError("");
        } catch (e) {
            setError(e.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const managers = users.filter((u) => u.isActive && (u.role === "manager" || u.role === "admin"));

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
            const matchesTeam = !teamFilter || u.team?.id === teamFilter;
            return matchesSearch && matchesTeam;
        });
    }, [users, search, teamFilter]);

    async function toggleActive(u) {
        const action = u.isActive ? "deactivate" : "activate";
        if (!confirm(`Are you sure you want to ${action} ${u.name}?`)) return;

        const res = await fetch(`/api/admin/users/${u.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive: !u.isActive }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error);
        setUsers((prev) => prev.map((x) => (x.id === data.user.id ? data.user : x)));
    }

    function handleSaved(saved) {
        setUsers((prev) =>
            prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [saved, ...prev]
        );
        setFormMode(null);
    }

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
                    <p className="text-sm text-gray-500">{users.length} people in the platform</p>
                </div>
                <button
                    onClick={() => setFormMode("create")}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                    + Add user
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email"
                    className="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
                <select
                    value={teamFilter}
                    onChange={(e) => setTeamFilter(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                    <option value="">All teams</option>
                    {teams.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="overflow-x-auto rounded-xl border bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 text-left text-gray-600">
                        <tr>
                            <th className="px-4 py-3 font-medium">Name</th>
                            <th className="px-4 py-3 font-medium">Role</th>
                            <th className="px-4 py-3 font-medium">Team</th>
                            <th className="px-4 py-3 font-medium">Manager</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="px-4 py-3 font-medium">Last login</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loading && (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
                        )}
                        {!loading && filtered.length === 0 && (
                            <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-500">No users found.</td></tr>
                        )}
                        {filtered.map((u) => (
                            <tr key={u.id} className={u.isActive ? "" : "opacity-50"}>
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900">{u.name}</p>
                                    <p className="text-gray-500">{u.email}</p>
                                    {u.designation && <p className="text-xs text-gray-400">{u.designation}</p>}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[u.role]}`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{u.team?.name || "—"}</td>
                                <td className="px-4 py-3 text-gray-700">{u.manager?.name || "—"}</td>
                                <td className="px-4 py-3">
                                    {u.isActive ? (
                                        <span className="text-green-700">Active</span>
                                    ) : (
                                        <span className="text-gray-500">Inactive</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "Never"}
                                </td>
                                <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                                    <button onClick={() => setFormMode(u)} className="text-indigo-600 hover:underline">Edit</button>
                                    {u.id !== currentUserId && (
                                        <button onClick={() => toggleActive(u)} className="text-gray-600 hover:underline">
                                            {u.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {formMode && (
                <UserForm
                    user={formMode === "create" ? null : formMode}
                    teams={teams}
                    managers={managers}
                    currentUserId={currentUserId}
                    onClose={() => setFormMode(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
}