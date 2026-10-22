"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ClientForm from "./ClientForm";
import { StatusBadge } from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { BILLING_LABELS } from "@/lib/constants";
import { formatDate, formatINR } from "@/lib/format";

const card = "space-y-3 rounded-xl border bg-white p-5";

export default function ClientDetail({ clientId }) {
    const [client, setClient] = useState(null);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState("");
    const [showForm, setShowForm] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/clients/${clientId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setClient(data.client);
            setProjects(data.projects);
        } catch (e) {
            setError(e.message || "Failed to load client.");
        }
    }, [clientId]);

    useEffect(() => {
        load();
    }, [load]);

    async function openForm() {
        if (!users.length) setUsers((await (await fetch("/api/users")).json()).users || []);
        setShowForm(true);
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                <Link href="/clients" className="text-sm text-indigo-600 hover:underline">← Back to clients</Link>
            </div>
        );
    }
    if (!client) return <p className="text-gray-500">Loading...</p>;

    const website = client.website && (client.website.startsWith("http") ? client.website : `https://${client.website}`);

    return (
        <div className="space-y-6">
            <Link href="/clients" className="text-sm text-indigo-600 hover:underline">← Back to clients</Link>

            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
                        <StatusBadge status={client.status} />
                    </div>
                    <p className="text-sm text-gray-500">
                        {client.industry || "—"}
                        {website && <> · <a href={website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{client.website}</a></>}
                        {" · "}Account manager: {client.accountManager?.name || "—"}
                    </p>
                </div>
                {client.permissions.canEdit && (
                    <button onClick={openForm} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                        Edit
                    </button>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    {client.deal && (
                        <div className={card}>
                            <h2 className="font-semibold text-gray-900">Deal</h2>
                            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                                <div><p className="text-gray-500">Budget</p><p className="font-medium">{formatINR(client.deal.budget)}</p></div>
                                <div><p className="text-gray-500">Billing</p><p className="font-medium">{BILLING_LABELS[client.deal.billingCycle]}</p></div>
                                <div><p className="text-gray-500">Start</p><p className="font-medium">{formatDate(client.deal.startDate)}</p></div>
                                <div><p className="text-gray-500">End</p><p className="font-medium">{formatDate(client.deal.endDate)}</p></div>
                            </div>
                            {client.deal.services.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {client.deal.services.map((s) => (
                                        <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs text-indigo-700">{s}</span>
                                    ))}
                                </div>
                            )}
                            {client.deal.terms && <p className="whitespace-pre-line text-sm text-gray-700">{client.deal.terms}</p>}
                        </div>
                    )}

                    <div className={card}>
                        <h2 className="font-semibold text-gray-900">Important notes</h2>
                        <p className="whitespace-pre-line text-sm text-gray-700">{client.notes || "—"}</p>
                    </div>

                    <div className={card}>
                        <h2 className="font-semibold text-gray-900">Brand guidelines</h2>
                        <p className="whitespace-pre-line text-sm text-gray-700">{client.brandGuidelines || "—"}</p>
                    </div>

                    <div className={card}>
                        <h2 className="font-semibold text-gray-900">Projects</h2>
                        {projects.length === 0 && <p className="text-sm text-gray-500">No projects linked to this client yet.</p>}
                        {projects.map((p) => (
                            <Link key={p.id} href={`/projects/${p.id}`} className="block space-y-1.5 rounded-lg border p-3 hover:bg-gray-50">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-900">{p.name}</span>
                                    <StatusBadge status={p.status} />
                                </div>
                                <ProgressBar percent={p.progress.percent} />
                            </Link>
                        ))}
                    </div>

                    <div className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-500">
                        Meetings and discussions will appear here (next step).
                    </div>
                </div>

                <div className="space-y-4">
                    <div className={card}>
                        <h2 className="font-semibold text-gray-900">Contacts</h2>
                        {client.contacts.length === 0 && <p className="text-sm text-gray-500">No contacts.</p>}
                        {client.contacts.map((c, i) => (
                            <div key={i} className="text-sm">
                                <p className="font-medium text-gray-900">{c.name}{c.role && <span className="font-normal text-gray-500"> · {c.role}</span>}</p>
                                {c.phone && <p className="text-gray-600">{c.phone}</p>}
                                {c.email && <a href={`mailto:${c.email}`} className="text-indigo-600 hover:underline">{c.email}</a>}
                            </div>
                        ))}
                    </div>

                    {client.accessUsers && (
                        <div className={card}>
                            <h2 className="font-semibold text-gray-900">Access</h2>
                            <div className="text-sm">
                                <p className="text-gray-500">Can see this client</p>
                                <p className="text-gray-900">{client.accessUsers.map((u) => u.name).join(", ") || "Admins only"}</p>
                            </div>
                            <div className="text-sm">
                                <p className="text-gray-500">Can see deal details</p>
                                <p className="text-gray-900">{client.dealVisibleTo.map((u) => u.name).join(", ") || "Admins only"}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <ClientForm
                    client={client}
                    users={users}
                    onClose={() => setShowForm(false)}
                    onSaved={(saved) => {
                        setClient(saved);
                        setShowForm(false);
                    }}
                />
            )}
        </div>
    );
}