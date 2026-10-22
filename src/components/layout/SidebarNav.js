"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav({ items }) {
    const pathname = usePathname();

    return (
        <nav className="flex-1 p-3 space-y-1">
            {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100"
                            }`}
                    >
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}