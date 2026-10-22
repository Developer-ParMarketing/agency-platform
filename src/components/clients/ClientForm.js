"use client";

import { useState } from "react";
import MultiSelect from "@/components/ui/MultiSelect";
import { CLIENT_STATUSES, BILLING_CYCLES, BILLING_LABELS, STATUS_LABELS } from "@/lib/constants";
import { toInputDate } from "@/lib/format";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";
const section = "space-y-3 rounded-lg border p-4";

const emptyContact = { name: "", role: "", phone: "", email: "" };

export default function ClientForm({ client, users, onClose, onSaved }) {
    const isEdit = !!client;
    const perms = client?.permissions || { canEditDeal: true, canManageAccess: true }; // creating = admin

    const [form, setForm] = useState({
        name: client?.name || "",
        industry: client?.industry || "",
        website: client?.website || "",
        status: client?.status || "lead",
        accountManager: client?.accountManager?.id || "",
        notes: client?.notes || "",
        brandGuidelines: client?.brandGuidelines || "",
    });
    const [contacts, setContacts] = useState(client?.contacts?.length ? client.contacts : []);
    const [deal, setDeal] = useState({
        services: (client?.deal?.services || []).join(", "),
        budget: client?.deal?.budget ?? "",
        billingCycle: client?.deal?.billingCycle || "monthly",
        startDate: toInputDate(client?.deal?.startDate),
        endDate: toInputDate(client?.deal?.endDate),
        terms: client?.deal?.terms || "",
    });
    const [accessUsers, setAccessUsers] = useState(client?.accessUsers?.map((u) => u.id) || []);
    const [dealVisibleTo, setDealVisibleTo] = useState(client?.dealVisibleTo?.map((u) => u.id) || []);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const setD = (key) => (e) => setDeal((d) => ({ ...d, [key]: e.target.value }));
    const setContact = (i, key) => (e) =>
        setContacts((list) => list.map((c, j) => (j === i ? { ...c, [key]: e.target.value } : c)));

    const userOptions = users.map((u) => ({ id: u.id, label: u.name, sublabel: u.team?.name || u.role }));

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = { ...form, contacts: contacts.filter((c) => c.name.trim()) };
        if (perms.canEditDeal) {
            payload.deal = {
                ...deal,
                budget: deal.budget || 0,
                services: deal.services.split(",").map((s) => s.trim()).filter(Boolean),
            };
        } else {
            delete payload.accountManager; // only admin can change it
        }
        if (perms.canManageAccess) {
            payload.accessUsers = accessUsers;
            payload.dealVisibleTo = dealVisibleTo;
        }

        try {
            const res = await fetch(isEdit ? `/api/clients/${client.id}` : "/api/clients", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved(data.client);
        } catch (err) {
            setError(err.message || "Could not save client.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">{isEdit ? `Edit ${client.name}` : "New client"}</h2>

                {/* Basics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <label className={label}>Client / company name</label>
                        <input className={input} value={form.name} onChange={set("name")} required />
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Industry</label>
                        <input className={input} value={form.industry} onChange={set("industry")} placeholder="e.g. Healthcare" />
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Website</label>
                        <input className={input} value={form.website} onChange={set("website")} placeholder="example.com" />
                    </div>
                    <div className="space-y-1">
                        <label className={label}>Status</label>
                        <select className={input} value={form.status} onChange={set("status")}>
                            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                    </div>
                    {perms.canEditDeal && (
                        <div className="space-y-1">
                            <label className={label}>Account manager</label>
                            <select className={input} value={form.accountManager} onChange={set("accountManager")}>
                                <option value="">None</option>
                                {users.filter((u) => u.role !== "member").map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {/* Contacts */}
                <div className={section}>
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">Contacts</h3>
                        <button type="button" onClick={() => setContacts((l) => [...l, { ...emptyContact }])}
                            className="text-sm text-indigo-600 hover:underline">+ Add contact</button>
                    </div>
                    {contacts.length === 0 && <p className="text-sm text-gray-400">No contacts yet.</p>}
                    {contacts.map((c, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                            <input className={input} placeholder="Name" value={c.name} onChange={setContact(i, "name")} />
                            <input className={input} placeholder="Role" value={c.role} onChange={setContact(i, "role")} />
                            <input className={input} placeholder="Phone" value={c.phone} onChange={setContact(i, "phone")} />
                            <input className={input} placeholder="Email" value={c.email} onChange={setContact(i, "email")} />
                            <button type="button" onClick={() => setContacts((l) => l.filter((_, j) => j !== i))}
                                className="text-sm text-gray-400 hover:text-red-600">Remove</button>
                        </div>
                    ))}
                </div>

                {/* Deal (admin only) */}
                {perms.canEditDeal && (
                    <div className={section}>
                        <h3 className="font-medium text-gray-900">Deal details <span className="text-xs font-normal text-gray-500">(admin + people you allow)</span></h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-1">
                                <label className={label}>Services (comma separated)</label>
                                <input className={input} value={deal.services} onChange={setD("services")} placeholder="SEO, Meta Ads, Social Media" />
                            </div>
                            <div className="space-y-1">
                                <label className={label}>Budget / retainer (₹)</label>
                                <input type="number" min="0" className={input} value={deal.budget} onChange={setD("budget")} />
                            </div>
                            <div className="space-y-1">
                                <label className={label}>Billing</label>
                                <select className={input} value={deal.billingCycle} onChange={setD("billingCycle")}>
                                    {BILLING_CYCLES.map((b) => <option key={b} value={b}>{BILLING_LABELS[b]}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className={label}>Contract start</label>
                                <input type="date" className={input} value={deal.startDate} onChange={setD("startDate")} />
                            </div>
                            <div className="space-y-1">
                                <label className={label}>Contract end</label>
                                <input type="date" className={input} value={deal.endDate} onChange={setD("endDate")} />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className={label}>Key terms</label>
                                <textarea className={input} rows={3} value={deal.terms} onChange={setD("terms")} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Notes */}
                <div className="space-y-1">
                    <label className={label}>Important notes & instructions</label>
                    <textarea className={input} rows={4} value={form.notes} onChange={set("notes")} />
                </div>
                <div className="space-y-1">
                    <label className={label}>Brand guidelines</label>
                    <textarea className={input} rows={3} value={form.brandGuidelines} onChange={set("brandGuidelines")}
                        placeholder="Colours, fonts, tone of voice, do's and don'ts" />
                </div>

                {/* Access (admin only) */}
                {perms.canManageAccess && (
                    <div className={section}>
                        <h3 className="font-medium text-gray-900">Access</h3>
                        <div className="space-y-1">
                            <label className={label}>Who can see this client</label>
                            <MultiSelect options={userOptions} value={accessUsers} onChange={setAccessUsers} placeholder="Search people" />
                        </div>
                        <div className="space-y-1">
                            <label className={label}>Who can also see deal details</label>
                            <MultiSelect options={userOptions} value={dealVisibleTo} onChange={setDealVisibleTo} placeholder="Search people" />
                            <p className="text-xs text-gray-500">Admins always see everything. The account manager can always open the client.</p>
                        </div>
                    </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                    <button type="submit" disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create client"}
                    </button>
                </div>
            </form>
        </div>
    );
}