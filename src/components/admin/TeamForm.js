"use client";

import { useState } from "react";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";

export default function TeamForm({ team, onClose, onSaved }) {
    const isEdit = !!team;
    const [form, setForm] = useState({
        name: team?.name || "",
        description: team?.description || "",
        color: team?.color || "#6366f1",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const res = await fetch(isEdit ? `/api/admin/teams/${team.id}` : "/api/admin/teams", {
                method: isEdit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved(data.team);
        } catch (err) {
            setError(err.message || "Could not save team.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">{isEdit ? `Edit ${team.name}` : "Add team"}</h2>

                <div className="space-y-1">
                    <label className={label}>Team name</label>
                    <input className={input} value={form.name} onChange={set("name")} required />
                </div>

                <div className="space-y-1">
                    <label className={label}>Description</label>
                    <textarea className={input} rows={3} value={form.description} onChange={set("description")} />
                </div>

                <div className="space-y-1">
                    <label className={label}>Colour</label>
                    <div className="flex items-center gap-3">
                        <input type="color" value={form.color} onChange={set("color")} className="h-10 w-14 cursor-pointer rounded border" />
                        <span className="text-sm text-gray-500">{form.color}</span>
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
                        {saving ? "Saving..." : isEdit ? "Save changes" : "Create team"}
                    </button>
                </div>
            </form>
        </div>
    );
}