"use client";

import { useState } from "react";

export function useMeetingFormData() {
    const [data, setData] = useState(null);

    async function ensure() {
        if (data) return data;
        const [c, p, u] = await Promise.all([fetch("/api/clients"), fetch("/api/projects"), fetch("/api/users")]);
        const loaded = {
            clients: (await c.json()).clients || [],
            projects: ((await p.json()).projects || []).filter((x) => !x.isArchived),
            users: (await u.json()).users || [],
        };
        setData(loaded);
        return loaded;
    }

    return { formData: data, ensureFormData: ensure };
}