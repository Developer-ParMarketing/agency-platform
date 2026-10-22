"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
    const [state, formAction, pending] = useActionState(login, null);

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <form action={formAction} className="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-5">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
                    <p className="text-sm text-gray-500 mt-1">Agency Platform</p>
                </div>

                <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                    <input id="email" name="email" type="email" required autoComplete="email"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <input id="password" name="password" type="password" required autoComplete="current-password"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

                <button type="submit" disabled={pending}
                    className="w-full rounded-lg bg-indigo-600 py-2 text-white font-medium hover:bg-indigo-700 disabled:opacity-60">
                    {pending ? "Signing in..." : "Sign in"}
                </button>
            </form>
        </main>
    );
}