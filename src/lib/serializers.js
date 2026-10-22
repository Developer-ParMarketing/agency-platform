function ref(doc) {
    if (!doc) return null;
    if (doc._id) return { id: doc._id.toString(), name: doc.name ?? null };
    return { id: doc.toString(), name: null };
}

export function toUserDTO(u) {
    return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        designation: u.designation || "",
        phone: u.phone || "",
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt || null,
        createdAt: u.createdAt,
        team: ref(u.team),
        manager: ref(u.manager),
    };
}

const refList = (list = [], extra = []) =>
    list.map((d) => {
        const out = { id: (d._id ?? d).toString(), name: d.name ?? null };
        for (const key of extra) out[key] = d[key] ?? null;
        return out;
    });

export function toProjectDTO(p, progress = null) {
    return {
        id: p._id.toString(),
        name: p.name,
        description: p.description || "",
        status: p.status,
        priority: p.priority,
        startDate: p.startDate,
        dueDate: p.dueDate,
        isArchived: p.isArchived,
        createdAt: p.createdAt,
        createdBy: ref(p.createdBy),
        teams: refList(p.teams, ["color"]),
        managers: refList(p.managers),
        members: refList(p.members),
        progress: progress || { total: 0, done: 0, percent: 0, byStatus: {} },
    };
}

export function toTaskDTO(t, permissions = null) {
    return {
        id: t._id.toString(),
        title: t.title,
        description: t.description || "",
        status: t.status,
        priority: t.priority,
        startDate: t.startDate,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours || 0,
        loggedHours: t.loggedHours || 0,
        completedAt: t.completedAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        project: ref(t.project),
        assignedTo: ref(t.assignedTo),
        assignedBy: ref(t.assignedBy),
        team: t.team?._id ? { id: t.team._id.toString(), name: t.team.name, color: t.team.color } : null,
        permissions: permissions || { canEdit: false, canChangeStatus: false, canAddUpdate: false },
    };
}

export function toTaskUpdateDTO(u) {
    return {
        id: u._id.toString(),
        note: u.note,
        hoursSpent: u.hoursSpent || 0,
        statusFrom: u.statusFrom,
        statusTo: u.statusTo,
        createdAt: u.createdAt,
        user: ref(u.user),
    };
}