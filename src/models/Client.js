import mongoose from "mongoose";
import { CLIENT_STATUSES, BILLING_CYCLES } from "@/lib/constants";

const { ObjectId } = mongoose.Schema.Types;

const ContactSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        role: { type: String, trim: true, default: "" },
        phone: { type: String, trim: true, default: "" },
        email: { type: String, trim: true, lowercase: true, default: "" },
    },
    { _id: false }
);

const ClientSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        industry: { type: String, trim: true, default: "" },
        website: { type: String, trim: true, default: "" },
        status: { type: String, enum: CLIENT_STATUSES, default: "lead" },
        contacts: { type: [ContactSchema], default: [] },
        accountManager: { type: ObjectId, ref: "User", default: null },
        deal: {
            services: { type: [String], default: [] },
            budget: { type: Number, default: 0 },
            billingCycle: { type: String, enum: BILLING_CYCLES, default: "monthly" },
            startDate: { type: Date, default: null },
            endDate: { type: Date, default: null },
            terms: { type: String, trim: true, default: "" },
        },
        notes: { type: String, trim: true, default: "" }, // important notes / instructions
        brandGuidelines: { type: String, trim: true, default: "" },
        accessUsers: [{ type: ObjectId, ref: "User" }], // who can open this client
        dealVisibleTo: [{ type: ObjectId, ref: "User" }], // who can see deal amounts
        createdBy: { type: ObjectId, ref: "User", required: true },
        isArchived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ClientSchema.index({ accessUsers: 1 });
ClientSchema.index({ accountManager: 1 });
ClientSchema.index({ status: 1 });

export default mongoose.models.Client || mongoose.model("Client", ClientSchema);