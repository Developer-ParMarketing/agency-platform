import { extOf } from "@/lib/file-types";

export default function AssetPreview({ assetId, version }) {
    if (!version) return null;
    const src = `/api/assets/${assetId}/file?v=${version.version}`;
    const type = version.mimeType || "";

    if (type.startsWith("image/")) {
        return (
            <div className="flex justify-center rounded-xl border bg-gray-50 p-4">
                <img src={src} alt={version.fileName} className="max-h-[70vh] max-w-full object-contain" />
            </div>
        );
    }

    if (type.startsWith("video/")) {
        return (
            <video key={src} src={src} controls preload="metadata" className="max-h-[70vh] w-full rounded-xl border bg-black" />
        );
    }

    if (type === "application/pdf") {
        return <iframe src={src} title={version.fileName} className="h-[75vh] w-full rounded-xl border" />;
    }

    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-gray-50 p-12 text-center">
            <span className="rounded-lg bg-white px-4 py-2 text-lg font-semibold uppercase text-gray-700 shadow-sm">
                .{extOf(version.fileName)}
            </span>
            <p className="text-sm text-gray-500">Preview isn't available for this file type yet.</p>
            <a href={`${src}&download=1`} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Download to view
            </a>
        </div>
    );
}