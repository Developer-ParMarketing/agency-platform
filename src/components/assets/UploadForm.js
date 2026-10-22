"use client";

import { useEffect, useState } from "react";
import { uploadWithProgress } from "@/lib/upload-client";
import { FILE_TYPES, ACCEPT_ATTR, fileKind, formatBytes } from "@/lib/file-types";

const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500";
const label = "text-sm font-medium text-gray-700";

export default function UploadForm({ projects = [], projectId, onClose, onUploaded }) {
    const [file, setFile] = useState(null);
    const [form, setForm] = useState({ title: "", description: "", project: projectId || "", task: "" });
    const [tasks, setTasks] = useState([]);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState("");

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

    // Load the chosen project's tasks so the upload can be linked to one
    useEffect(() => {
        if (!form.project) return setTasks([]);
        fetch(`/api/tasks?project=${form.project}`)
            .then((r) => r.json())
            .then((d) => setTasks(d.tasks || []))
            .catch(() => setTasks([]));
    }, [form.project]);

    function pickFile(e) {
        const f = e.target.files?.[0];
        setError("");
        if (!f) return setFile(null);

        const kind = fileKind(f.name);
        if (!kind) {
            e.target.value = "";
            return setError("This file type isn't allowed.");
        }
        if (f.size > FILE_TYPES[kind].maxMB * 1024 * 1024) {
            e.target.value = "";
            return setError(`${FILE_TYPES[kind].label} files can be up to ${FILE_TYPES[kind].maxMB} MB.`);
        }
        setFile(f);
        if (!form.title) setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, "") }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (!file) return setError("Choose a file to upload.");

        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        fd.append("project", form.project);
        fd.append("task", form.task);
        fd.append("file", file); // file last, so the text fields arrive first

        setUploading(true);
        setError("");
        try {
            const data = await uploadWithProgress("/api/assets", fd, setProgress);
            onUploaded(data.asset);
        } catch (err) {
            setError(err.message);
            setProgress(0);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-gray-900">Upload for approval</h2>

                <div className="space-y-1">
                    <label className={label}>File</label>
                    <input type="file" accept={ACCEPT_ATTR} onChange={pickFile} disabled={uploading}
                        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-indigo-700" />
                    {file && <p className="text-xs text-gray-500">{file.name} · {formatBytes(file.size)}</p>}
                    <p className="text-xs text-gray-400">Images 20 MB · Documents 50 MB · Videos 500 MB</p>
                </div>

                <div className="space-y-1">
                    <label className={label}>Title</label>
                    <input className={input} value={form.title} onChange={set("title")} />
                </div>

                <div className="space-y-1">
                    <label className={label}>Description / notes for the reviewer</label>
                    <textarea className={input} rows={3} value={form.description} onChange={set("description")} />
                </div>

                {!projectId && (
                    <div className="space-y-1">
                        <label className={label}>Project</label>
                        <select className={input} value={form.project} onChange={(e) => setForm((f) => ({ ...f, project: e.target.value, task: "" }))} required>
                            <option value="">Select a project</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-1">
                    <label className={label}>Related task (optional)</label>
                    <select className={input} value={form.task} onChange={set("task")} disabled={!form.project}>
                        <option value="">No task</option>
                        {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>

                {uploading && (
                    <div className="space-y-1">
                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="text-xs text-gray-500">{progress < 100 ? `Uploading... ${progress}%` : "Processing..."}</p>
                    </div>
                )}

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} disabled={uploading}
                        className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        Cancel
                    </button>
                    <button type="submit" disabled={uploading || !file}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                        {uploading ? "Uploading..." : "Upload"}
                    </button>
                </div>
            </form>
        </div>
    );
}