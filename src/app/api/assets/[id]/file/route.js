import { Readable } from "stream";
import { requireUser, handleApiError, HttpError } from "@/lib/auth-helpers";
import { loadVisibleAsset } from "@/services/assets";
import { statFile, readStream } from "@/lib/storage";
import { connectDB } from "@/lib/db";
import AssetVersion from "@/models/AssetVersion";

export async function GET(request, { params }) {
    try {
        const me = await requireUser();
        const { id } = await params;
        await connectDB();

        const asset = await loadVisibleAsset(me, id);
        const sp = new URL(request.url).searchParams;
        const versionNo = Number(sp.get("v")) || asset.currentVersion;

        const version = await AssetVersion.findOne({ asset: id, version: versionNo }).lean();
        if (!version) throw new HttpError(404, "Version not found.");

        const { size } = await statFile(version.filePath).catch(() => {
            throw new HttpError(404, "File is missing on the server.");
        });

        const disposition = sp.get("download") ? "attachment" : "inline";
        const headers = {
            "Content-Type": version.mimeType,
            "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(version.fileName)}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=3600",
            "X-Content-Type-Options": "nosniff",
        };

        const range = request.headers.get("range");
        if (range) {
            const match = /bytes=(\d*)-(\d*)/.exec(range);
            const start = match?.[1] ? Number(match[1]) : 0;
            const end = match?.[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
            if (start >= size || start > end) {
                return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
            }
            const stream = Readable.toWeb(readStream(version.filePath, { start, end }));
            return new Response(stream, {
                status: 206,
                headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
            });
        }

        const stream = Readable.toWeb(readStream(version.filePath));
        return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
    } catch (err) {
        return handleApiError(err);
    }
}