import mongoose from "mongoose";

const TeamSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        description: { type: String, trim: true, default: "" },
        managers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        color: { type: String, default: "#6366f1" },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.models.Team || mongoose.model("Team", TeamSchema);