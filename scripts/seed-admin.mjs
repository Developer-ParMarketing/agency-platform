import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const [name, email, password] = process.argv.slice(2);

if (!name || !email || !password) {
    console.log('Usage: node --env-file=.env.local scripts/seed-admin.mjs "Name" email@company.com "Password"');
    process.exit(1);
}
if (password.length < 8) {
    console.log("Password must be at least 8 characters.");
    process.exit(1);
}

const TEAMS = ["Developer", "SEO", "Content Writer", "Ads / Lead Generation", "Social Media", "Graphic Designer"];

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
const now = new Date();

// Teams (created only if missing)
for (const teamName of TEAMS) {
    await db.collection("teams").updateOne(
        { name: teamName },
        {
            $setOnInsert: {
                name: teamName, description: "", managers: [], color: "#6366f1",
                isActive: true, createdAt: now, updatedAt: now,
            },
        },
        { upsert: true }
    );
}
console.log(`Teams ready: ${TEAMS.length}`);

// Admin
const existing = await db.collection("users").findOne({ email: email.toLowerCase() });
if (existing) {
    console.log(`User ${email} already exists, skipped.`);
} else {
    await db.collection("users").insertOne({
        name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12),
        role: "admin", team: null, manager: null, designation: "Admin", phone: "", avatar: "",
        isActive: true, lastLoginAt: null, failedLoginAttempts: 0, lockUntil: null,
        createdAt: now, updatedAt: now,
    });
    console.log(`Admin created: ${email}`);
}

await mongoose.disconnect();