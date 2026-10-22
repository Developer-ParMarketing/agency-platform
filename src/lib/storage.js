import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import crypto from "crypto";

const ROOT = path.resolve(process.env.UPLOAD_DIR || "./uploads");
const TRASH = path.join(ROOT, ".trash");

// Blocks paths like "../../etc/passwd"
function resolveSafe(rel) {
    const full = path.resolve(ROOT, rel);
    if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid file path");
    return full;
}

// A new random file path like "2026/10/3f2a...e1.mp4"
export function prepareTarget(ext) {
    const now = new Date();
    const dir = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
    const rel = `${dir}/${crypto.randomUUID()}.${ext}`.split(path.sep).join("/");
    return { rel, full: resolveSafe(rel) };
}

export function statFile(rel) {
    return fsp.stat(resolveSafe(rel));
}

export function readStream(rel, options) {
    return fs.createReadStream(resolveSafe(rel), options);
}

// Immediate delete (used when an upload fails validation)
export async function deleteFile(rel) {
    await fsp.unlink(resolveSafe(rel)).catch(() => { });
}

// Soft delete: move to .trash so cleanup mistakes can be undone (used in Phase 7)
export async function trashFile(rel) {
    const from = resolveSafe(rel);
    const day = new Date().toISOString().slice(0, 10);
    const toDir = path.join(TRASH, day);
    await fsp.mkdir(toDir, { recursive: true });
    await fsp.rename(from, path.join(toDir, path.basename(from))).catch(() => { });
}