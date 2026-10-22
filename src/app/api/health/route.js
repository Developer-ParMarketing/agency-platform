import { connectDB } from "@/lib/db";

export async function GET() {
    try {
        const conn = await connectDB();
        return Response.json({ ok: true, db: conn.connection.name });
    } catch (err) {
        return Response.json({ ok: false, error: err.message }, { status: 500 });
    }
}