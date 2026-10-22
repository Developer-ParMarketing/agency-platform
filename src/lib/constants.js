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
};