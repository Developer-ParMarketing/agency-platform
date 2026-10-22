import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import authConfig from "./auth.config";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsed = loginSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const { email, password } = parsed.data;
                await connectDB();

                const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
                if (!user || !user.isActive) return null;

                if (user.lockUntil && user.lockUntil > new Date()) return null;

                const valid = await bcrypt.compare(password, user.passwordHash);

                if (!valid) {
                    const attempts = (user.failedLoginAttempts || 0) + 1;
                    const update =
                        attempts >= MAX_ATTEMPTS
                            ? { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) }
                            : { failedLoginAttempts: attempts };
                    await User.updateOne({ _id: user._id }, update);
                    return null;
                }

                await User.updateOne(
                    { _id: user._id },
                    { failedLoginAttempts: 0, lockUntil: null, lastLoginAt: new Date() }
                );

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    team: user.team ? user.team.toString() : null,
                };
            },
        }),
    ],
});