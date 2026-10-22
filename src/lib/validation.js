import { z } from "zod";
import { HttpError } from "@/lib/auth-helpers";
import { ROLE_LIST, PROJECT_STATUSES, TASK_STATUSES, PRIORITIES } from "@/lib/constants";

// ---------- Shared ----------
export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
const nullableId = z.union([objectId, z.literal(""), z.null()]).transform((v) => v || null);
const idList = z.array(objectId);

// Accepts "2026-10-22", "" or null. Empty becomes null.
const nullableDate = z
    .union([z.string(), z.null()])
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !isNaN(d.getTime()), "Invalid date");

const datesInOrder = (d) => !d.startDate || !d.dueDate || d.dueDate >= d.startDate;
const dateOrderMsg = { message: "Due date can't be before the start date" };

// ---------- Users ----------
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

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Enter your current password"),
        newPassword: z.string().min(8, "New password must be at least 8 characters"),
    })
    .refine((d) => d.currentPassword !== d.newPassword, {
        message: "New password must be different from the current one",
    });

// ---------- Teams ----------
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

// ---------- Projects ----------
export const createProjectSchema = z
    .object({
        name: z.string().trim().min(2, "Project name is too short").max(120),
        description: z.string().trim().max(2000).optional().default(""),
        teams: idList.optional().default([]),
        managers: idList.optional().default([]),
        members: idList.optional().default([]),
        status: z.enum(PROJECT_STATUSES).optional().default("planning"),
        priority: z.enum(PRIORITIES).optional().default("medium"),
        startDate: nullableDate.optional(),
        dueDate: nullableDate.optional(),
    })
    .refine(datesInOrder, dateOrderMsg);

export const updateProjectSchema = z
    .object({
        name: z.string().trim().min(2, "Project name is too short").max(120).optional(),
        description: z.string().trim().max(2000).optional(),
        teams: idList.optional(),
        managers: idList.optional(),
        members: idList.optional(),
        status: z.enum(PROJECT_STATUSES).optional(),
        priority: z.enum(PRIORITIES).optional(),
        startDate: nullableDate.optional(),
        dueDate: nullableDate.optional(),
        isArchived: z.boolean().optional(),
    })
    .refine(datesInOrder, dateOrderMsg);


// ---------- Tasks ----------
const hours = (max) => z.coerce.number().min(0, "Hours can't be negative").max(max);

export const createTaskSchema = z
    .object({
        title: z.string().trim().min(2, "Task title is too short").max(200),
        description: z.string().trim().max(5000).optional().default(""),
        project: objectId,
        assignedTo: objectId,
        status: z.enum(TASK_STATUSES).optional().default("todo"),
        priority: z.enum(PRIORITIES).optional().default("medium"),
        startDate: nullableDate.optional(),
        dueDate: nullableDate.optional(),
        estimatedHours: hours(1000).optional().default(0),
    })
    .refine(datesInOrder, dateOrderMsg);

export const updateTaskSchema = z.object({
    title: z.string().trim().min(2, "Task title is too short").max(200).optional(),
    description: z.string().trim().max(5000).optional(),
    assignedTo: objectId.optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    startDate: nullableDate.optional(),
    dueDate: nullableDate.optional(),
    estimatedHours: hours(1000).optional(),
});

export const taskProgressSchema = z.object({
    note: z.string().trim().min(1, "Write what you worked on").max(2000),
    hoursSpent: hours(24).optional().default(0),
    status: z.enum(TASK_STATUSES).optional(),
});

// ---------- Helper ----------
export function validate(schema, data) {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new HttpError(400, result.error.issues[0]?.message || "Invalid input");
    }
    return result.data;
}