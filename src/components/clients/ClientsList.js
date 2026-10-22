"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ClientForm from "./ClientForm";
import { StatusBadge } from "@/components/ui/Badge";
import { CLIENT_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { useRouter } from "next/navigation";

export default function ClientsList({ canCreate }) {
    const router = useRouter();
    const [clients, setClients] = useState([]);
    const [users, setUsers] = useState([]);
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async () => {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (res.ok) setClients(data.clients);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        if (!users.length) setUsers((await (await fetch("/api/users")).json()).users || []);
        setShowForm(true);
    }

    const q = search.trim().toLowerCase();
    const visible = clients.filter(
        (c) => (!status || c.status === status) && (!q || c.name.toLowerCase().includes(q) || c.industry.toLowerCase().includes(q))
    );

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
                    <p className="text-sm text-gray-500">{clients.length} clients you can access</p>
                </div>
                {canCreate && (
                    <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        + New client
                    </button>
                )}
            </div>

            <div className="flex flex-wrap gap-3">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or industry"
                    className="w-64 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm" />
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">All statuses</option>
                    {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
            </div>

            {loading && <p className="text-gray-500">Loading...</p>}
            {!loading && visible.length === 0 && (
                <div className="rounded-xl border border-dashed bg-white p-10 text-center text-gray-500">
                    {clients.length ? "No clients match." : "No clients yet, or you haven't been given access to any."}
                </div>
            )}

            <div className="overflow-x-auto rounded-xl border bg-white">
                {visible.length > 0 && (
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                                <th className="px-4 py-3 font-medium">Client</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Account manager</th>
                                <th className="px-4 py-3 font-medium">Main contact</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {visible.map((c) => (
                                <tr key={c.id} onClick={() => router.push(`/clients/${c.id}`)} className="cursor-pointer hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link href={`/clients/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{c.name}</Link>
                                        {c.industry && <p className="text-xs text-gray-500">{c.industry}</p>}
                                    </td>
                                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                    <td className="px-4 py-3 text-gray-700">{c.accountManager?.name || "—"}</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {c.contacts[0] ? `${c.contacts[0].name}${c.contacts[0].phone ? ` · ${c.contacts[0].phone}` : ""}` : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showForm && (
                <ClientForm
                    users={users}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setClients((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)));
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}