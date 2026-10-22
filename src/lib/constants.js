export const ROLES = {
    ADMIN: "admin",
    MANAGER: "manager",
    MEMBER: "member",
};

export const ROLE_LIST = Object.values(ROLES);

export const DEFAULT_TEAMS = [
    "Developer",
    "SEO",
    "Content Writer",
    "Ads / Lead Generation",
    "Social Media",
    "Graphic Designer",
];

export const PROJECT_STATUSES = ["planning", "active", "on_hold", "completed", "cancelled"];
export const TASK_STATUSES = ["todo", "in_progress", "in_review", "done", "blocked"];
export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const STATUS_LABELS = {
    planning: "Planning",
    active: "Active",
    on_hold: "On hold",
    completed: "Completed",
    cancelled: "Cancelled",
    todo: "To do",
    in_progress: "In progress",
    in_review: "In review",
    done: "Done",
    blocked: "Blocked",
    pending_manager: "Waiting for manager",
    pending_admin: "Waiting for admin",
    changes_requested: "Changes requested",
    rejected: "Rejected",
    approved: "Approved",
    lead: "Lead",
    paused: "Paused",
    closed: "Closed",
};
export const ASSET_STATUSES = ["pending_manager", "pending_admin", "changes_requested", "rejected", "approved"];
export const APPROVAL_DECISIONS = ["approved", "changes_requested", "rejected"];
export const CLIENT_STATUSES = ["lead", "active", "paused", "closed"];
export const BILLING_CYCLES = ["monthly", "quarterly", "yearly", "one_time"];
export const BILLING_LABELS = { monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly", one_time: "One-time" };