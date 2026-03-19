/**
 * ============================================================
 *  JustCheers — Server Entry Point
 *  server.js  (project root)
 * ============================================================
 */

import dotenv from "dotenv";
import http from "http";
import { Server as SocketIO } from "socket.io";

// Load .env FIRST before any other imports that read process.env
dotenv.config({ path: "./.env" });

import app from "./src/app.js";
import connectDb, { disconnectDb } from "./src/db/db.js";

const PORT = process.env.PORT || 5000;
const ENV = process.env.NODE_ENV || "development";

// ── HTTP Server ───────────────────────────────────────────────
const server = http.createServer(app);

// ── Socket.IO — Real-time Delivery Tracking ───────────────────
const io = new SocketIO(server, {
  cors: {
    origin: (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()),
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60_000,
  pingInterval: 25_000,
});

// Make io accessible in controllers via req.app.get("io")
app.set("io", io);

// ── Socket Events ─────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`🔌  Socket connected   | id: ${socket.id}`);

  // Customer joins a room for their specific order
  socket.on("order:subscribe", (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`📦  Socket ${socket.id} joined room → order:${orderId}`);
  });

  // Delivery partner broadcasts live GPS
  socket.on("partner:location", ({ orderId, latitude, longitude }) => {
    socket.to(`order:${orderId}`).emit("partner:location", {
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    });
  });

  // Partner goes online / offline
  socket.on("partner:status", ({ partnerId, isOnline }) => {
    console.log(
      `🛵  Partner ${partnerId} is now ${isOnline ? "ONLINE" : "OFFLINE"}`,
    );
    io.emit("partner:status", { partnerId, isOnline });
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `🔌  Socket disconnected | id: ${socket.id} | reason: ${reason}`,
    );
  });

  socket.on("error", (err) => {
    console.error(`🔥  Socket error | id: ${socket.id}:`, err.message);
  });
});

// ── Boot Sequence ─────────────────────────────────────────────
const start = async () => {
  try {
    await connectDb();

    server.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════╗
║         🍺  JustCheers API Running           ║
╠══════════════════════════════════════════════╣
║  URL    : http://localhost:${PORT}              ║
║  ENV    : ${ENV.padEnd(35)}║
║  Health : http://localhost:${PORT}/health       ║
║  Docs   : http://localhost:${PORT}/api/v1       ║
╚══════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error("❌  Server failed to start:", err.message);
    process.exit(1);
  }
};

start();

// ── Graceful Shutdown ─────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully…`);

  server.close(async () => {
    console.log("🛑  HTTP server closed");
    await disconnectDb();
    io.close(() => {
      console.log("🛑  Socket.IO closed");
      process.exit(0);
    });
  });

  // Force exit after 10 s if graceful shutdown hangs
  setTimeout(() => {
    console.error("⏱  Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("🔥  Unhandled Rejection:", reason);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("🔥  Uncaught Exception:", err.message);
  shutdown("uncaughtException");
});
