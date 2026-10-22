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
        client: ref(p.client),
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

export function toAssetDTO(a, permissions = null) {
    return {
        id: a._id.toString(),
        title: a.title,
        description: a.description || "",
        type: a.type,
        status: a.status,
        currentVersion: a.currentVersion,
        current: {
            fileName: a.current?.fileName,
            fileSize: a.current?.fileSize,
            mimeType: a.current?.mimeType,
        },
        approvedAt: a.approvedAt,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        project: ref(a.project),
        task: a.task?._id ? { id: a.task._id.toString(), name: a.task.title } : null,
        uploadedBy: ref(a.uploadedBy),
        team: a.team?._id ? { id: a.team._id.toString(), name: a.team.name, color: a.team.color } : null,
        permissions: permissions || { canReview: false, canUploadVersion: false, canEdit: false },
    };
}

export function toAssetVersionDTO(v) {
    return {
        id: v._id.toString(),
        version: v.version,
        fileName: v.fileName,
        fileSize: v.fileSize,
        mimeType: v.mimeType,
        changeNote: v.changeNote || "",
        createdAt: v.createdAt,
        uploadedBy: ref(v.uploadedBy),
    };
}

export function toApprovalDTO(a) {
    return {
        id: a._id.toString(),
        version: a.version,
        stage: a.stage,
        decision: a.decision,
        keyPoints: a.keyPoints || [],
        comment: a.comment || "",
        createdAt: a.createdAt,
        reviewer: ref(a.reviewer),
    };
}

export function toClientDTO(c, permissions) {
    const p = permissions || { canEdit: false, canEditDeal: false, canManageAccess: false, canSeeDeal: false };
    return {
        id: c._id.toString(),
        name: c.name,
        industry: c.industry || "",
        website: c.website || "",
        status: c.status,
        contacts: c.contacts || [],
        accountManager: ref(c.accountManager),
        notes: c.notes || "",
        brandGuidelines: c.brandGuidelines || "",
        isArchived: c.isArchived,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        // Deal data is removed entirely for people who can't see it
        deal: p.canSeeDeal ? c.deal : null,
        accessUsers: p.canManageAccess ? refList(c.accessUsers) : null,
        dealVisibleTo: p.canManageAccess ? refList(c.dealVisibleTo) : null,
        permissions: p,
    };
}

export function toMeetingDTO(m, permissions = null) {
    return {
        id: m._id.toString(),
        title: m.title,
        date: m.date,
        client: ref(m.client),
        project: ref(m.project),
        attendees: refList(m.attendees),
        externalAttendees: m.externalAttendees || "",
        agenda: m.agenda || "",
        notes: m.notes || "",
        decisions: m.decisions || "",
        actionItems: (m.actionItems || []).map((a) => ({
            id: a._id.toString(),
            text: a.text,
            assignee: ref(a.assignee),
            dueDate: a.dueDate,
            task: a.task?._id ? { id: a.task._id.toString(), title: a.task.title, status: a.task.status } : null,
        })),
        createdBy: ref(m.createdBy),
        createdAt: m.createdAt,
        permissions: permissions || { canEdit: false, canCreateTasks: false },
    };
}