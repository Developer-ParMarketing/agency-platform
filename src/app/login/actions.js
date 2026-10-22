"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function login(prevState, formData) {
    try {
        await signIn("credentials", {
            email: formData.get("email"),
            password: formData.get("password"),
            redirectTo: "/dashboard",
        });
    } catch (error) {
        if (error instanceof AuthError) {
            return { error: "Invalid email or password." };
        }
        throw error; // needed so the redirect after login works
    }
}