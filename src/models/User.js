import mongoose from "mongoose";
import { ROLE_LIST, ROLES } from "@/lib/constants";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ROLE_LIST, default: ROLES.MEMBER },
        team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
        manager: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        designation: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        avatar: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date, default: null },
        failedLoginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date, default: null },
    },
    { timestamps: true }
);

UserSchema.index({ role: 1, team: 1 });
UserSchema.index({ manager: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);