import { ROLES } from "@/lib/constants";

const ALL = Object.values(ROLES);

export const NAV_ITEMS = [
    { href: "/dashboard", label: "Dashboard", roles: ALL },
    { href: "/projects", label: "Projects", roles: ALL },
    { href: "/tasks", label: "Tasks", roles: ALL },
    { href: "/assets", label: "Assets & Approvals", roles: ALL },
    { href: "/clients", label: "Clients", roles: ALL },
    { href: "/meetings", label: "Meetings", roles: ALL },
    { href: "/reports", label: "Reports", roles: [ROLES.ADMIN, ROLES.MANAGER] },
    { href: "/admin/users", label: "Users", roles: [ROLES.ADMIN] },
    { href: "/admin/teams", label: "Teams", roles: [ROLES.ADMIN] },
    { href: "/profile", label: "My profile", roles: ALL },
];

export function navForRole(role) {
    return NAV_ITEMS.filter((item) => item.roles.includes(role)).map(({ href, label }) => ({ href, label }));
}