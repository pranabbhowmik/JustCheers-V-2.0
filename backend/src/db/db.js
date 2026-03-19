/**
 * ============================================================
 *  JustCheers — MongoDB Connection
 *  src/db/db.js
 * ============================================================
 */

import mongoose from "mongoose";

// ── Connection options ────────────────────────────────────────
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
  maxPoolSize: 10,
  minPoolSize: 2,
};

let isConnected = false;

const connectDb = async () => {
  if (isConnected) {
    console.log("⚡  MongoDB already connected — reusing connection");
    return;
  }

  const uri = process.env.DB_URL;
  if (!uri) throw new Error("❌  DB_URL is not defined in .env");

  try {
    const conn = await mongoose.connect(uri, MONGO_OPTIONS);
    isConnected = true;
    console.log(
      `✅  MongoDB Connected | Host: ${conn.connection.host} | DB: ${conn.connection.name}`,
    );
  } catch (error) {
    console.error("❌  MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

// ── Mongoose lifecycle events ─────────────────────────────────
mongoose.connection.on("disconnected", () => {
  isConnected = false;
  console.warn("⚠️  MongoDB Disconnected");
});

mongoose.connection.on("reconnected", () => {
  isConnected = true;
  console.log("🔄  MongoDB Reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("🔥  MongoDB Runtime Error:", err.message);
});

// ── Graceful disconnect (used in tests / shutdown) ────────────
export const disconnectDb = async () => {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  console.log("🛑  MongoDB connection closed");
};

export default connectDb;
