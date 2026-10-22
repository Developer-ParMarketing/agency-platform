"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AssetPreview from "./AssetPreview";
import ReviewPanel from "./ReviewPanel";
import { StatusBadge } from "@/components/ui/Badge";
import { STATUS_LABELS } from "@/lib/constants";
import { ACCEPT_ATTR, formatBytes } from "@/lib/file-types";
import { formatDateTime } from "@/lib/format";
import { uploadWithProgress } from "@/lib/upload-client";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";

const DECISION_STYLES = {
    approved: "text-green-700",
    changes_requested: "text-amber-700",
    rejected: "text-red-700",
};

export default function AssetDetail({ assetId, me }) {
    const [asset, setAsset] = useState(null);
    const [versions, setVersions] = useState([]);
    const [approvals, setApprovals] = useState([]);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState("");

    const [editing, setEditing] = useState(false);
    const [edit, setEdit] = useState({ title: "", description: "" });

    const [newFile, setNewFile] = useState(null);
    const [changeNote, setChangeNote] = useState("");
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);

    const load = useCallback(async () => {
        try {
            const res = await fetch(`/api/assets/${assetId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setAsset(data.asset);
            setVersions(data.versions);
            setApprovals(data.approvals);
            setSelected(data.versions[0] || null);
        } catch (e) {
            setError(e.message || "Failed to load asset.");
        }
    }, [assetId]);

    useEffect(() => {
        load();
    }, [load]);

    async function saveEdit(extra = {}) {
        const res = await fetch(`/api/assets/${assetId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...edit, ...extra }),
        });
        const data = await res.json();
        if (!res.ok) return alert(data.error);
        setAsset(data.asset);
        setEditing(false);
    }

    async function uploadVersion(e) {
        e.preventDefault();
        if (!newFile) return;
        const fd = new FormData();
        fd.append("changeNote", changeNote);
        fd.append("file", newFile);

        setUploading(true);
        try {
            await uploadWithProgress(`/api/assets/${assetId}/versions`, fd, setProgress);
            setNewFile(null);
            setChangeNote("");
            setProgress(0);
            e.target.reset();
            await load();
        } catch (err) {
            alert(err.message);
        } finally {
            setUploading(false);
        }
    }

    if (error) {
        return (
            <div className="space-y-3">
                <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
                <Link href="/assets" className="text-sm text-indigo-600 hover:underline">← Back to assets</Link>
            </div>
        );
    }
    if (!asset) return <p className="text-gray-500">Loading...</p>;

    const isCurrent = selected?.version === asset.currentVersion;

    return (
        <div className="space-y-6">
            <Link href="/assets" className="text-sm text-indigo-600 hover:underline">← Back to assets</Link>

            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                {editing ? (
                    <div className="w-full max-w-xl space-y-2">
                        <input className={input} value={edit.title} onChange={(e) => setEdit((f) => ({ ...f, title: e.target.value }))} />
                        <textarea className={input} rows={3} value={edit.description}
                            onChange={(e) => setEdit((f) => ({ ...f, description: e.target.value }))} />
                        <div className="flex gap-2">
                            <button onClick={() => saveEdit()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Save</button>
                            <button onClick={() => setEditing(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-2xl font-semibold text-gray-900">{asset.title}</h1>
                            <StatusBadge status={asset.status} />
                            <span className="text-sm text-gray-500">v{asset.currentVersion}</span>
                        </div>
                        {asset.description && <p className="max-w-2xl whitespace-pre-line text-gray-600">{asset.description}</p>}
                        <p className="text-sm text-gray-500">
                            <Link href={`/projects/${asset.project.id}`} className="text-indigo-600 hover:underline">{asset.project.name}</Link>
                            {asset.task && <> · Task: <Link href={`/tasks/${asset.task.id}`} className="text-indigo-600 hover:underline">{asset.task.name}</Link></>}
                            {" · "}Uploaded by {asset.uploadedBy?.name}{asset.team && ` (${asset.team.name})`}
                        </p>
                    </div>
                )}

                {!editing && asset.permissions.canEdit && (
                    <div className="flex gap-2">
                        <button onClick={() => { setEdit({ title: asset.title, description: asset.description }); setEditing(true); }}
                            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                        <button onClick={() => confirm("Archive this asset?") && saveEdit({ isArchived: true })}
                            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Archive</button>
                    </div>
                )}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left: preview + review */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            Viewing <strong>v{selected?.version}</strong> · {selected?.fileName} · {formatBytes(selected?.fileSize)}
                            {!isCurrent && <span className="ml-2 rounded bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-800">Older version</span>}
                        </span>
                        {selected && (
                            <a href={`/api/assets/${asset.id}/file?v=${selected.version}&download=1`} className="text-indigo-600 hover:underline">
                                Download
                            </a>
                        )}
                    </div>

                    <AssetPreview assetId={asset.id} version={selected} />

                    {asset.permissions.canReview && <ReviewPanel asset={asset} me={me} onReviewed={load} />}

                    {asset.permissions.canUploadVersion && (
                        <form onSubmit={uploadVersion} className="space-y-3 rounded-xl border bg-white p-5">
                            <h2 className="font-semibold text-gray-900">Upload a new version</h2>
                            <p className="text-sm text-gray-500">The review starts again from the first stage.</p>
                            <input type="file" accept={ACCEPT_ATTR} onChange={(e) => setNewFile(e.target.files?.[0] || null)} disabled={uploading}
                                className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-indigo-700" />
                            <input className={input} placeholder="What changed in this version?" value={changeNote}
                                onChange={(e) => setChangeNote(e.target.value)} disabled={uploading} />
                            {uploading && (
                                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                    <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                            )}
                            <button type="submit" disabled={!newFile || uploading}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                                {uploading ? `Uploading ${progress}%` : "Upload version"}
                            </button>
                        </form>
                    )}
                </div>

                {/* Right: versions + history */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <h2 className="font-semibold text-gray-900">Versions</h2>
                        {versions.map((v) => (
                            <button key={v.id} onClick={() => setSelected(v)}
                                className={`block w-full rounded-lg border p-3 text-left text-sm ${selected?.id === v.id ? "border-indigo-400 bg-indigo-50" : "bg-white hover:bg-gray-50"
                                    }`}>
                                <div className="flex justify-between">
                                    <span className="font-medium text-gray-900">v{v.version}{v.version === asset.currentVersion && " (current)"}</span>
                                    <span className="text-xs text-gray-500">{formatDateTime(v.createdAt)}</span>
                                </div>
                                <p className="truncate text-xs text-gray-500">{v.fileName} · {v.uploadedBy?.name}</p>
                                {v.changeNote && <p className="mt-1 text-xs text-gray-700">"{v.changeNote}"</p>}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <h2 className="font-semibold text-gray-900">Approval history</h2>
                        {approvals.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
                        {approvals.map((a) => (
                            <div key={a.id} className="space-y-1 rounded-lg border bg-white p-3 text-sm">
                                <div className="flex justify-between gap-2">
                                    <span className={`font-medium ${DECISION_STYLES[a.decision]}`}>{STATUS_LABELS[a.decision]}</span>
                                    <span className="text-xs text-gray-500">v{a.version}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {a.reviewer?.name} · {a.stage === "admin" ? "Admin" : "Manager"} review · {formatDateTime(a.createdAt)}
                                </p>
                                {a.keyPoints.length > 0 && (
                                    <ul className="list-disc space-y-0.5 pl-5 text-gray-700">
                                        {a.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                )}
                                {a.comment && <p className="text-gray-700">{a.comment}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}