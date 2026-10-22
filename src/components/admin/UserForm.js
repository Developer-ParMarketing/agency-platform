"use client";

import { useState } from "react";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";

export default function UserForm({ user, teams, managers, currentUserId, onClose, onSaved }) {
    const isEdit = !!user;
    const [form, setForm] = useState({
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        role: user?.role || "member",
        team: user?.team?.id || "",
        manager: user?.manager?.id || "",
        designation: user?.designation || "",
        phone: user?.phone || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
    const editingSelf = isEdit && user.id === currentUserId;

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = { ...form };
        if (isEdit) {
            delete payload.email; // email is not editable
            if (!payload.password) delete payload.password;
        }

        try {
            const res = await fetch(isEdit ? `/api/admin/users/${user.id}` : "/api/admin/users", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved(data.user);
        } catch (err) {
            setError(err.message || "Could not save user.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">{isEdit ? `Edit ${user.name}` : "Add user"}</h2>

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <label className={label}>Full name</label>
                        <input className={input} value={form.name} onChange={set("name")} required />
                    </div>

                    <div className="col-span-2 space-y-1">
                        <label className={label}>Email</label>
                        <input className={input} type="email" value={form.email} onChange={set("email")} required disabled={isEdit} />
                    </div>

                    <div className="col-span-2 space-y-1">
                        <label className={label}>{isEdit ? "New password (leave blank to keep current)" : "Password"}</label>
                        <input
                            className={input}
                            type="password"
                            value={form.password}
                            onChange={set("password")}
                            required={!isEdit}
                            minLength={8}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className={label}>Role</label>
                        <select className={input} value={form.role} onChange={set("role")} disabled={editingSelf}>
                            <option value="member">Member</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className={label}>Team</label>
                        <select className={input} value={form.team} onChange={set("team")}>
                            <option value="">No team</option>
                            {teams.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <label className={label}>Reports to (manager)</label>
                        <select className={input} value={form.manager} onChange={set("manager")}>
                            <option value="">No manager</option>
                            {managers
                                .filter((m) => m.id !== user?.id)
                                .map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.name} ({m.role})
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className={label}>Designation</label>
                        <input className={input} value={form.designation} onChange={set("designation")} placeholder="e.g. SEO Executive" />
                    </div>

                    <div className="space-y-1">
                        <label className={label}>Phone</label>
                        <input className={input} value={form.phone} onChange={set("phone")} />
                    </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create user"}
                    </button>
                </div>
            </form>
        </div>
    );
}