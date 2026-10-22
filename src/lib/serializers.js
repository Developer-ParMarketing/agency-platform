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