import busboy from "busboy";
import fs from "fs";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { HttpError } from "@/lib/auth-helpers";
import { FILE_TYPES, MIME_BY_EXT, MAX_UPLOAD_MB, extOf, fileKind } from "@/lib/file-types";
import { prepareTarget, statFile, deleteFile } from "@/lib/storage";

async function saveIncomingFile(stream, filename) {
    const kind = fileKind(filename);
    if (!kind) {
        stream.resume(); // drain and discard
        throw new HttpError(400, "This file type isn't allowed.");
    }

    const ext = extOf(filename);
    const { rel, full } = prepareTarget(ext);
    await pipeline(stream, fs.createWriteStream(full));

    const { size } = await statFile(rel);
    const { maxMB, label } = FILE_TYPES[kind];
    if (stream.truncated || size > maxMB * 1024 * 1024) {
        await deleteFile(rel);
        throw new HttpError(413, `${label} files can be up to ${maxMB} MB.`);
    }
    if (size === 0) {
        await deleteFile(rel);
        throw new HttpError(400, "The file is empty.");
    }

    return { rel, size, originalName: filename, ext, kind, mimeType: MIME_BY_EXT[ext] };
}

// Returns { fields, file } — file is null if none was sent
export async function parseUpload(request) {
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data") || !request.body) {
        throw new HttpError(400, "Expected a file upload.");
    }

    const fields = {};
    let fileResult = null;

    const bb = busboy({
        headers: { "content-type": contentType },
        limits: { files: 1, fields: 20, fieldSize: 10_000, fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
    });

    bb.on("field", (name, value) => {
        fields[name] = value;
    });
    bb.on("file", (name, stream, info) => {
        // store success or error; awaited after the whole request is read
        fileResult = saveIncomingFile(stream, info.filename).then(
            (file) => ({ file }),
            (error) => ({ error })
        );
    });

    await new Promise((resolve, reject) => {
        bb.on("close", resolve);
        bb.on("error", reject);
        Readable.fromWeb(request.body).pipe(bb);
    });

    if (!fileResult) return { fields, file: null };
    const { file, error } = await fileResult;
    if (error) throw error;
    return { fields, file };
}