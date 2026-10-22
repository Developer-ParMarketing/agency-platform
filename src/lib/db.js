import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is missing in .env.local");

let cached = global._mongoose || (global._mongoose = { conn: null, promise: null });

export async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null; // allow a retry on the next request
        throw err;
    }
    return cached.conn;
}