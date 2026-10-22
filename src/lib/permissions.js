import { ROLES } from "@/lib/constants";

const { ADMIN, MANAGER, MEMBER } = ROLES;

const PERMISSIONS = {
    "users.manage": [ADMIN],
    "teams.manage": [ADMIN],
    "projects.create": [ADMIN, MANAGER],
    "tasks.assign": [ADMIN, MANAGER],
    "assets.upload": [ADMIN, MANAGER, MEMBER],
    "assets.approve": [ADMIN, MANAGER],
    "clients.viewAll": [ADMIN],
    "clients.manageAccess": [ADMIN],
    "reports.company": [ADMIN],
    "reports.team": [ADMIN, MANAGER],
    "settings.manage": [ADMIN],
};

export function can(user, action) {
    return PERMISSIONS[action]?.includes(user?.role) ?? false;
}

export function requirePermission(user, action, HttpErrorClass) {
    if (!can(user, action)) throw new HttpErrorClass(403, "You don't have permission for this.");
}