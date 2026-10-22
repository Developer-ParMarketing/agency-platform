import { requireUser, handleApiError } from "@/lib/auth-helpers";
import { validate, reportQuerySchema } from "@/lib/validation";
import { rangeIST, employeeReport, teamReport, companyReport } from "@/services/reports";
import { connectDB } from "@/lib/db";

// GET /api/reports?type=employee&user=ID&from=2026-10-01&to=2026-10-31
export async function GET(request) {
    try {
        const me = await requireUser();
        const sp = Object.fromEntries(new URL(request.url).searchParams);
        const q = validate(reportQuerySchema, sp);
        const { start, end } = rangeIST(q.from, q.to);

        await connectDB();
        let report;
        if (q.type === "employee") report = await employeeReport(me, q.user, start, end);
        if (q.type === "team") report = await teamReport(me, q.team, start, end);
        if (q.type === "company") report = await companyReport(me, start, end);

        return Response.json({ report: { ...report, type: q.type, from: q.from, to: q.to } });
    } catch (err) {
        return handleApiError(err);
    }
}