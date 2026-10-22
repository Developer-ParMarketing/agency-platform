"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { formatDate, isOverdue } from "@/lib/format";

function Stat({ label, value, tone = "default", href }) {
    const tones = {
        default: "text-gray-900",
        danger: value > 0 ? "text-red-600" : "text-gray-900",
        warn: value > 0 ? "text-amber-600" : "text-gray-900",
    };
    const body = (
        <div className="rounded-xl border bg-white p-4 hover:border-indigo-200">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
        </div>
    );
    return href ? <Link href={href}>{body}</Link> : body;
}

function Card({ title, action, children }) {
    return (
        <div className="space-y-3 rounded-xl border bg-white p-5">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{title}</h2>
                {action}
            </div>
            {children}
        </div>
    );
}

const viewAll = (href) => <Link href={href} className="text-sm text-indigo-600 hover:underline">View all</Link>;

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardView({ me }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/dashboard")
            .then(async (r) => {
                const d = await r.json();
                if (!r.ok) throw new Error(d.error);
                setData(d);
            })
            .catch((e) => setError(e.message || "Failed to load dashboard."));
    }, []);

    if (error) return <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
    if (!data) return <p className="text-gray-500">Loading...</p>;

    const { my, reviewQueue, team, company } = data;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">{greeting()}, {me.name.split(" ")[0]}</h1>
                <p className="text-sm text-gray-500">Here's what needs your attention today.</p>
            </div>

            {company && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                    <Stat label="Active projects" value={company.stats.activeProjects} href="/projects" />
                    <Stat label="Open tasks" value={company.stats.openTasks} href="/tasks" />
                    <Stat label="Overdue tasks" value={company.stats.overdueTasks} tone="danger" />
                    <Stat label="Pending approvals" value={company.stats.pendingApprovals} tone="warn" href="/assets" />
                    <Stat label="Active clients" value={company.stats.activeClients} href="/clients" />
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Stat label="My open tasks" value={my.stats.open} href="/tasks" />
                <Stat label="My overdue" value={my.stats.overdue} tone="danger" />
                <Stat label="Due in next 7 days" value={my.stats.dueThisWeek} tone="warn" />
                {reviewQueue ? (
                    <Stat label="Waiting for my review" value={reviewQueue.count} tone="warn" href="/assets" />
                ) : (
                    <Stat label="My tasks in review" value={my.stats.inReview} />
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Card title="My next tasks" action={viewAll("/tasks")}>
                    {my.tasks.length === 0 && <p className="text-sm text-gray-500">You're all caught up.</p>}
                    <div className="divide-y">
                        {my.tasks.map((t) => {
                            const late = isOverdue(t.dueDate, t.status);
                            return (
                                <Link key={t.id} href={`/tasks/${t.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
                                        <p className="truncate text-xs text-gray-500">{t.project?.name}</p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <PriorityBadge priority={t.priority} />
                                        <span className={`text-xs ${late ? "font-medium text-red-600" : "text-gray-500"}`}>
                                            {t.dueDate ? formatDate(t.dueDate) : "No due date"}
                                        </span>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </Card>

                {reviewQueue && (
                    <Card title="Waiting for my review" action={viewAll("/assets")}>
                        {reviewQueue.items.length === 0 && <p className="text-sm text-gray-500">Nothing to review.</p>}
                        <div className="divide-y">
                            {reviewQueue.items.map((a) => (
                                <Link key={a.id} href={`/assets/${a.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900">{a.title} <span className="text-gray-400">v{a.currentVersion}</span></p>
                                        <p className="truncate text-xs text-gray-500">{a.uploadedBy?.name} · {a.project?.name}</p>
                                    </div>
                                    <StatusBadge status={a.status} />
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}

                {my.assetsToFix.length > 0 && (
                    <Card title="My assets that need changes">
                        <div className="divide-y">
                            {my.assetsToFix.map((a) => (
                                <Link key={a.id} href={`/assets/${a.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50">
                                    <p className="truncate text-sm font-medium text-gray-900">{a.title}</p>
                                    <StatusBadge status={a.status} />
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}

                {company && company.atRisk.length > 0 && (
                    <Card title="Projects at risk">
                        <div className="divide-y">
                            {company.atRisk.map((p) => (
                                <Link key={p.id} href={`/projects/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50">
                                    <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                                    <span className="text-xs font-medium text-red-600">{p.overdue} overdue task{p.overdue > 1 ? "s" : ""}</span>
                                </Link>
                            ))}
                        </div>
                    </Card>
                )}
            </div>

            {team && (
                <Card
                    title={me.role === "admin" ? "Team workload (everyone)" : "My team's workload"}
                    action={<span className="text-sm text-gray-500">{team.totals.open} open · {team.totals.overdue} overdue · {team.totals.doneThisWeek} done this week</span>}
                >
                    {team.members.length === 0 ? (
                        <p className="text-sm text-gray-500">No team members yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-left text-gray-500">
                                    <tr>
                                        <th className="py-2 pr-4 font-medium">Person</th>
                                        <th className="py-2 pr-4 font-medium">Team</th>
                                        <th className="py-2 pr-4 font-medium text-right">Open</th>
                                        <th className="py-2 pr-4 font-medium text-right">Overdue</th>
                                        <th className="py-2 pr-4 font-medium text-right">Done this week</th>
                                        <th className="py-2 font-medium text-right">Hours this week</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {team.members.map((m) => (
                                        <tr key={m.id}>
                                            <td className="py-2 pr-4">
                                                <p className="font-medium text-gray-900">{m.name}</p>
                                                {m.designation && <p className="text-xs text-gray-500">{m.designation}</p>}
                                            </td>
                                            <td className="py-2 pr-4 text-gray-600">{m.team}</td>
                                            <td className="py-2 pr-4 text-right">{m.open}</td>
                                            <td className={`py-2 pr-4 text-right ${m.overdue ? "font-medium text-red-600" : ""}`}>{m.overdue}</td>
                                            <td className="py-2 pr-4 text-right">{m.doneThisWeek}</td>
                                            <td className="py-2 text-right">{m.hoursThisWeek}h</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}