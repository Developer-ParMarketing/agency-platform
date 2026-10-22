import { Suspense } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <Suspense fallback={<aside className="w-64 shrink-0 bg-white border-r" />}>
                <Sidebar />
            </Suspense>
            <div className="flex-1 flex flex-col min-w-0">
                <Suspense fallback={<header className="h-16 bg-white border-b" />}>
                    <Topbar />
                </Suspense>
                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}