export const FILE_TYPES = {
    image: { label: "Image", exts: ["jpg", "jpeg", "png", "webp", "gif"], maxMB: 20 },
    video: { label: "Video", exts: ["mp4", "mov", "webm"], maxMB: 500 },
    excel: { label: "Excel", exts: ["xlsx", "xls", "csv"], maxMB: 50 },
    word: { label: "Word", exts: ["docx", "doc"], maxMB: 50 },
    pdf: { label: "PDF", exts: ["pdf"], maxMB: 50 },
    other: { label: "Other", exts: ["pptx", "ppt", "zip", "psd", "ai", "txt"], maxMB: 200 },
};

export const MIME_BY_EXT = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
    mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel", csv: "text/csv",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    doc: "application/msword", pdf: "application/pdf",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ppt: "application/vnd.ms-powerpoint", zip: "application/zip",
    psd: "image/vnd.adobe.photoshop", ai: "application/postscript", txt: "text/plain",
};

export const MAX_UPLOAD_MB = Math.max(...Object.values(FILE_TYPES).map((t) => t.maxMB));

export const ACCEPT_ATTR = Object.values(FILE_TYPES).flatMap((t) => t.exts).map((e) => `.${e}`).join(",");

export function extOf(filename = "") {
    const i = filename.lastIndexOf(".");
    return i === -1 ? "" : filename.slice(i + 1).toLowerCase();
}

export function fileKind(filename) {
    const ext = extOf(filename);
    return Object.keys(FILE_TYPES).find((k) => FILE_TYPES[k].exts.includes(ext)) || null;
}

export function formatBytes(bytes = 0) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}