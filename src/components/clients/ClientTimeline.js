"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

const DOTS = {
    meeting: "bg-indigo-500",
    task: "bg-gray-400",
    task_done: "bg-green-500",
    asset: "bg-orange-400",
    asset_approved: "bg-green-600",
};

export default function ClientTimeline({ clientId }) {
    const [events, setEvents] = useState(null);

    useEffect(() => {
        fetch(`/api/clients/${clientId}/timeline`)
            .then((r) => r.json())
            .then((d) => setEvents(d.events || []))
            .catch(() => setEvents([]));
    }, [clientId]);

    return (
        <div className="space-y-3 rounded-xl border bg-white p-5">
            <h2 className="font-semibold text-gray-900">Timeline</h2>
            {events === null && <p className="text-sm text-gray-500">Loading...</p>}
            {events?.length === 0 && <p className="text-sm text-gray-500">Nothing yet.</p>}

            <ol className="relative space-y-4 border-l border-gray-200 pl-5">
                {events?.map((e, i) => (
                    <li key={i} className="relative">
                        <span className={`absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${DOTS[e.type]}`} />
                        <Link href={e.href} className="block hover:text-indigo-600">
                            <p className="text-sm font-medium text-gray-900">{e.title}</p>
                            <p className="text-xs text-gray-500">{e.detail} · {formatDateTime(e.date)}</p>
                        </Link>
                    </li>
                ))}
            </ol>
        </div>
    );
}