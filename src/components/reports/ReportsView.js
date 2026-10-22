"use client";

import { useEffect, useState } from "react";
import { exportExcel, exportPDF } from "@/lib/report-export";

const input = "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";

const day = (d) => {
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
};

function preset(name) {
    const now = new Date();
    if (name === "this_week") {
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        return { from: day(monday), to: day(now) };
    }
    if (name === "last_month") {
        return { from: day(new Date(now.getFullYear(), now.getMonth() - 1, 1)), to: day(new Date(now.getFullYear(), now.getMonth(), 0)) };
    }
    return { from: day(new Date(now.getFullYear(), now.getMonth(), 1)), to: day(now) }; // this month
}

function typesFor(role) {
    if (role === "admin") return [["employee", "Employee"], ["team", "Team"], ["company", "Company"]];
    if (role === "manager") return [["employee", "Employee"], ["team", "My team"]];
    return [["employee", "My report"]];
}

export default function ReportsView({ me }) {
    const types = typesFor(me.role);
    const [type, setType] = useState(types[0][0]);
    const [person, setPerson] = useState(me.id);
    const [team, setTeam] = useState("");
    const [period, setPeriod] = useState("this_month");
    const [range, setRange] = useState(preset("this_month"));
    const [people, setPeople] = useState([]);
    const [teams, setTeams] = useState([]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (me.role === "member") return;
        fetch("/api/users").then((r) => r.json()).then((d) => {
            const all = d.users || [];
            // managers see themselves + their team / reports (the server checks again)
            setPeople(me.role === "admin" ? all : all.filter((u) => u.id === me.id || u.manager === me.id || (me.team && u.team?.id === me.team)));
        });
        if (me.role === "admin") {
            fetch("/api/teams").then((r) => r.json()).then((d) => {
                setTeams(d.teams || []);
                setTeam(d.teams?.[0]?.id || "");
            });
        }
    }, [me]);

    function choosePeriod(p) {
        setPeriod(p);
        if (p !== "custom") setRange(preset(p));
    }

    async function run() {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ type, from: range.from, to: range.to });
        if (type === "employee") params.set("user", person);
        if (type === "team" && me.role === "admin") params.set("team", team);
        try {
            const res = await fetch(`/api/reports?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setReport(data.report);
        } catch (e) {
            setError(e.message || "Could not build the report.");
            setReport(null);
        } finally {
            setLoading(false);
        }
    }

    async function doExport(kind) {
        setExporting(kind);
        try {
            if (kind === "excel") await exportExcel(report);
            else await exportPDF(report);
        } catch (e) {
            alert(`Export failed: ${e.message}`);
        } finally {
            setExporting("");
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
                {types.length > 1 && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Report</label>
                        <select className={input} value={type} onChange={(e) => { setType(e.target.value); setReport(null); }}>
                            {types.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                    </div>
                )}

                {type === "employee" && me.role !== "member" && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Person</label>
                        <select className={input} value={person} onChange={(e) => setPerson(e.target.value)}>
                            {people.map((u) => <option key={u.id} value={u.id}>{u.name}{u.id === me.id ? " (me)" : ""}</option>)}
                        </select>
                    </div>
                )}

                {type === "team" && me.role === "admin" && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Team</label>
                        <select className={input} value={team} onChange={(e) => setTeam(e.target.value)}>
                            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600">Period</label>
                    <select className={input} value={period} onChange={(e) => choosePeriod(e.target.value)}>
                        <option value="this_week">This week</option>
                        <option value="this_month">This month</option>
                        <option value="last_month">Last month</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                {period === "custom" && (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">From</label>
                            <input type="date" className={input} value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-600">To</label>
                            <input type="date" className={input} value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
                        </div>
                    </>
                )}

                <button onClick={run} disabled={loading}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                    {loading ? "Building..." : "Generate"}
                </button>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            {report && (
                <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{report.title}</h2>
                            <p className="text-sm text-gray-500">
                                {report.subtitle && `${report.subtitle} · `}{report.from} to {report.to}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => doExport("excel")} disabled={!!exporting}
                                className="rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                                {exporting === "excel" ? "Preparing..." : "Download Excel"}
                            </button>
                            <button onClick={() => doExport("pdf")} disabled={!!exporting}
                                className="rounded-lg border bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                                {exporting === "pdf" ? "Preparing..." : "Download PDF"}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {report.summary.map((s) => (
                            <div key={s.label} className="rounded-xl border bg-white p-4">
                                <p className="text-sm text-gray-500">{s.label}</p>
                                <p className="mt-1 text-2xl font-semibold text-gray-900">{s.value}</p>
                            </div>
                        ))}
                    </div>

                    {report.tables.map((t) => (
                        <div key={t.title} className="space-y-2">
                            <h3 className="font-semibold text-gray-900">{t.title} <span className="text-sm font-normal text-gray-500">({t.rows.length})</span></h3>
                            <div className="overflow-x-auto rounded-xl border bg-white">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50 text-left text-gray-600">
                                        <tr>{t.columns.map((c) => <th key={c.key} className="whitespace-nowrap px-4 py-2.5 font-medium">{c.label}</th>)}</tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {t.rows.length === 0 && (
                                            <tr><td colSpan={t.columns.length} className="px-4 py-4 text-center text-gray-500">No data for this period.</td></tr>
                                        )}
                                        {t.rows.map((r, i) => (
                                            <tr key={i}>
                                                {t.columns.map((c) => <td key={c.key} className="whitespace-nowrap px-4 py-2 text-gray-800">{r[c.key]}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}