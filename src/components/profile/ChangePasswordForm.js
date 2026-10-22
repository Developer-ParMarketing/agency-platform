"use client";

import { useState } from "react";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

export default function ChangePasswordForm() {
    const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [saving, setSaving] = useState(false);

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        if (form.newPassword !== form.confirm) {
            return setStatus({ type: "error", message: "New passwords don't match." });
        }
        setSaving(true);
        setStatus({ type: "", message: "" });
        try {
            const res = await fetch("/api/me/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setForm({ currentPassword: "", newPassword: "", confirm: "" });
            setStatus({ type: "success", message: "Password changed successfully." });
        } catch (err) {
            setStatus({ type: "error", message: err.message || "Could not change password." });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-6">
            <h2 className="font-semibold text-gray-900">Change password</h2>

            <input className={input} type="password" placeholder="Current password" value={form.currentPassword}
                onChange={set("currentPassword")} required autoComplete="current-password" />
            <input className={input} type="password" placeholder="New password (min 8 characters)" value={form.newPassword}
                onChange={set("newPassword")} required minLength={8} autoComplete="new-password" />
            <input className={input} type="password" placeholder="Confirm new password" value={form.confirm}
                onChange={set("confirm")} required minLength={8} autoComplete="new-password" />

            {status.message && (
                <p className={`text-sm ${status.type === "success" ? "text-green-700" : "text-red-600"}`}>{status.message}</p>
            )}

            <button type="submit" disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                {saving ? "Saving..." : "Change password"}
            </button>
        </form>
    );
}