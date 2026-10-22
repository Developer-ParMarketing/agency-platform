"use client";

import { useState } from "react";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

const DECISIONS = [
    { key: "approved", label: "Approve", style: "bg-green-600 hover:bg-green-700" },
    { key: "changes_requested", label: "Request changes", style: "bg-amber-500 hover:bg-amber-600" },
    { key: "rejected", label: "Reject", style: "bg-red-600 hover:bg-red-700" },
];

export default function ReviewPanel({ asset, me, onReviewed }) {
    const [points, setPoints] = useState([]);
    const [pointInput, setPointInput] = useState("");
    const [comment, setComment] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const stageText =
        me.role === "admin"
            ? asset.status === "pending_manager"
                ? "As admin, your approval is final and skips the manager step."
                : "Your approval is final."
            : "If you approve, it goes to admin for final approval.";

    function addPoint() {
        const p = pointInput.trim();
        if (!p) return;
        setPoints((prev) => [...prev, p]);
        setPointInput("");
    }

    async function submit(decision) {
        setBusy(true);
        setError("");
        try {
            const res = await fetch(`/api/assets/${asset.id}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ decision, keyPoints: points, comment }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onReviewed();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 p-5">
            <div>
                <h2 className="font-semibold text-gray-900">Your review</h2>
                <p className="text-sm text-gray-600">Reviewing version {asset.currentVersion}. {stageText}</p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Key points</label>
                <div className="flex gap-2">
                    <input className={input} value={pointInput} placeholder="e.g. Logo too small"
                        onChange={(e) => setPointInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPoint(); } }} />
                    <button type="button" onClick={addPoint} className="rounded-lg border bg-white px-3 text-sm text-gray-700 hover:bg-gray-50">
                        Add
                    </button>
                </div>
                {points.length > 0 && (
                    <ul className="space-y-1">
                        {points.map((p, i) => (
                            <li key={i} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-sm">
                                <span>• {p}</span>
                                <button type="button" onClick={() => setPoints(points.filter((_, j) => j !== i))}
                                    className="text-xs text-gray-400 hover:text-red-600">Remove</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <textarea className={input} rows={3} placeholder="Comment (required when rejecting or requesting changes)"
                value={comment} onChange={(e) => setComment(e.target.value)} />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex flex-wrap gap-2">
                {DECISIONS.map((d) => (
                    <button key={d.key} type="button" disabled={busy} onClick={() => submit(d.key)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60 ${d.style}`}>
                        {d.label}
                    </button>
                ))}
            </div>
        </div>
    );
}