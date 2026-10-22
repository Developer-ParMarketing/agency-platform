"use client";

import { useState } from "react";

export default function MultiSelect({ options, value, onChange, placeholder = "Search..." }) {
    const [query, setQuery] = useState("");
    const q = query.trim().toLowerCase();
    const visible = options.filter((o) => !q || o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q));

    function toggle(id) {
        onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    }

    return (
        <div className="rounded-lg border border-gray-300">
            <div className="flex items-center gap-2 border-b px-3 py-2">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 text-sm outline-none"
                />
                <span className="text-xs text-gray-500">{value.length} selected</span>
            </div>
            <div className="max-h-40 overflow-y-auto p-1">
                {visible.length === 0 && <p className="px-2 py-2 text-sm text-gray-400">No matches</p>}
                {visible.map((o) => (
                    <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50">
                        <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
                        <span className="text-gray-900">{o.label}</span>
                        {o.sublabel && <span className="text-xs text-gray-500">{o.sublabel}</span>}
                    </label>
                ))}
            </div>
        </div>
    );
}