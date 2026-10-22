import { STATUS_LABELS } from "@/lib/constants";

const STATUS_STYLES = {
    planning: "bg-gray-100 text-gray-700",
    active: "bg-green-100 text-green-700",
    on_hold: "bg-yellow-100 text-yellow-800",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    todo: "bg-gray-100 text-gray-700",
    in_progress: "bg-indigo-100 text-indigo-700",
    in_review: "bg-yellow-100 text-yellow-800",
    done: "bg-green-100 text-green-700",
    blocked: "bg-red-100 text-red-700",
};

const PRIORITY_STYLES = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-50 text-blue-700",
    high: "bg-orange-100 text-orange-700",
    urgent: "bg-red-100 text-red-700",
};

const base = "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status }) {
    return <span className={`${base} ${STATUS_STYLES[status] || STATUS_STYLES.todo}`}>{STATUS_LABELS[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
    return <span className={`${base} capitalize ${PRIORITY_STYLES[priority]}`}>{priority}</span>;
}