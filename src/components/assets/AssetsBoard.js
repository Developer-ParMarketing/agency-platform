"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import UploadForm from "./UploadForm";
import { StatusBadge } from "@/components/ui/Badge";
import { ASSET_STATUSES, STATUS_LABELS } from "@/lib/constants";
import { FILE_TYPES, extOf } from "@/lib/file-types";
import { formatDate } from "@/lib/format";

function tabsFor(role) {
    const tabs = [];
    if (role !== "member") tabs.push({ key: "review", label: "Needs my review" });
    tabs.push({ key: "mine", label: "My uploads" });
    tabs.push({ key: "all", label: role === "admin" ? "All assets" : "All I can see" });
    return tabs;
}

function Thumb({ asset }) {
    if (asset.type === "image") {
        return <img src={`/api/assets/${asset.id}/file`} alt="" loading="lazy" className="h-40 w-full object-cover" />;
    }
    return (
        <div className="flex h-40 w-full flex-col items-center justify-center gap-1 bg-gray-50">
            <span className="text-sm font-semibold uppercase text-gray-600">.{extOf(asset.current.fileName)}</span>
            <span className="text-xs text-gray-400">{FILE_TYPES[asset.type]?.label}</span>
        </div>
    );
}

export default function AssetsBoard({ me }) {
    const tabs = tabsFor(me.role);
    const [tab, setTab] = useState(tabs[0].key);
    const [status, setStatus] = useState("");
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState([]);
    const [showUpload, setShowUpload] = useState(false);

    const load = useCallback(async (scope) => {
        setLoading(true);
        const res = await fetch(`/api/assets${scope === "all" ? "" : `?scope=${scope}`}`);
        const data = await res.json();
        if (res.ok) setAssets(data.assets);
        setLoading(false);
    }, []);

    useEffect(() => {
        load(tab);
    }, [load, tab]);

    async function openUpload() {
        if (!projects.length) {
            const data = await (await fetch("/api/projects")).json();
            setProjects(data.projects || []);
        }
        setShowUpload(true);
    }

    const visible = status ? assets.filter((a) => a.status === status) : assets;

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Assets & Approvals</h1>
                    <p className="text-sm text-gray-500">{assets.length} assets</p>
                </div>
                <button onClick={openUpload} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    + Upload
                </button>
            </div>

            <div className="flex gap-1 border-b">
                {tabs.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.key ? "border-indigo-600 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab !== "review" && (
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                    <option value="">All statuses</option>
                    {ASSET_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
            )}

            {loading && <p className="text-gray-500">Loading...</p>}
            {!loading && visible.length === 0 && (
                <div className="rounded-xl border border-dashed bg-white p-10 text-center text-gray-500">
                    {tab === "review" ? "Nothing is waiting for your review." : "No assets here."}
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visible.map((a) => (
                    <Link key={a.id} href={`/assets/${a.id}`} className="overflow-hidden rounded-xl border bg-white hover:border-indigo-300 hover:shadow-sm">
                        <Thumb asset={a} />
                        <div className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="line-clamp-2 font-medium text-gray-900">{a.title}</h2>
                                <span className="shrink-0 text-xs text-gray-500">v{a.currentVersion}</span>
                            </div>
                            <StatusBadge status={a.status} />
                            <p className="text-xs text-gray-500">{a.project?.name}</p>
                            <p className="text-xs text-gray-400">{a.uploadedBy?.name} · {formatDate(a.updatedAt)}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {showUpload && (
                <UploadForm
                    projects={projects.filter((p) => !p.isArchived)}
                    onClose={() => setShowUpload(false)}
                    onUploaded={(asset) => {
                        setShowUpload(false);
                        if (tab !== "review") setAssets((prev) => [asset, ...prev]);
                    }}
                />
            )}
        </div>
    );
}