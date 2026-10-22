import { z } from "zod";
import { HttpError } from "@/lib/auth-helpers";
import { ROLE_LIST } from "@/lib/constants";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const nullableId = z.union([objectId, z.literal(""), z.null()]).transform((v) => v || null);

export const createUserSchema = z.object({
    name: z.string().trim().min(2, "Name is too short").max(80),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(ROLE_LIST),
    team: nullableId.optional(),
    manager: nullableId.optional(),
    designation: z.string().trim().max(80).optional().default(""),
    phone: z.string().trim().max(20).optional().default(""),
});

export const updateUserSchema = z.object({
    name: z.string().trim().min(2, "Name is too short").max(80).optional(),
    role: z.enum(ROLE_LIST).optional(),
    team: nullableId.optional(),
    manager: nullableId.optional(),
    designation: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(20).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export function validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new HttpError(400, result.error.issues[0]?.message || "Invalid input");
    }
    return result.data;
}

const colorField = z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a valid colour");

export const createTeamSchema = z.object({
    name: z.string().trim().min(2, "Team name is too short").max(50),
    description: z.string().trim().max(200).optional().default(""),
    color: colorField.optional().default("#6366f1"),
});

export const updateTeamSchema = z.object({
    name: z.string().trim().min(2, "Team name is too short").max(50).optional(),
    description: z.string().trim().max(200).optional(),
    color: colorField.optional(),
    isActive: z.boolean().optional(),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Enter your current password"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
        message: "New password must be different from the current one",
    });