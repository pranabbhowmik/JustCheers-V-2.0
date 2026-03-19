/**
 * ============================================================
 *  JustCheers — Express Application
 *  src/app.js
 * ============================================================
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

// ── ESM __dirname shim ────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================================
//  SECURITY MIDDLEWARE
// ============================================================
app.use(helmet()); // Set secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL injection attacks
app.use(compression()); // Gzip all responses

// ============================================================
//  CORS
// ============================================================
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow REST clients (Postman) and whitelisted origins
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== "production"
      ) {
        return cb(null, true);
      }
      cb(new Error(`CORS: Origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ============================================================
//  RATE LIMITING
// ============================================================
// Global limiter — 200 requests per 15 min per IP
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many requests. Try again later." },
  }),
);

// Stricter limiter for auth routes — 20 req per 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Wait 15 minutes.",
  },
});

// ============================================================
//  BODY PARSERS
// ============================================================
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ============================================================
//  HTTP REQUEST LOGGER
// ============================================================
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

// ============================================================
//  STATIC FILES
// ============================================================
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// ============================================================
//  HEALTH CHECK  →  GET /health
// ============================================================
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    app: "JustCheers API",
    version: process.env.npm_package_version || "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    env: process.env.NODE_ENV || "development",
  });
});

// ============================================================
//  ROOT ROUTE  →  GET /
// ============================================================
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "🍺 Welcome to JustCheers API",
    version: "v1",
    docs: "/api/v1",
    health: "/health",
  });
});

// ============================================================
//  API ROUTES  (uncomment as you create each route file)
// ============================================================
// import authRoutes     from "./routes/auth.routes.js";
// import userRoutes     from "./routes/user.routes.js";
// import shopRoutes     from "./routes/shop.routes.js";
// import productRoutes  from "./routes/product.routes.js";
// import orderRoutes    from "./routes/order.routes.js";
// import paymentRoutes  from "./routes/payment.routes.js";
// import deliveryRoutes from "./routes/delivery.routes.js";
// import reviewRoutes   from "./routes/review.routes.js";

const API = "/api/v1";

// app.use(`${API}/auth`,     authLimiter, authRoutes);
// app.use(`${API}/users`,    userRoutes);
// app.use(`${API}/shops`,    shopRoutes);
// app.use(`${API}/products`, productRoutes);
// app.use(`${API}/orders`,   orderRoutes);
// app.use(`${API}/payments`, paymentRoutes);
// app.use(`${API}/delivery`, deliveryRoutes);
// app.use(`${API}/reviews`,  reviewRoutes);

// ── API index (shows available endpoints) ────────────────────
app.get(API, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "JustCheers REST API v1",
    endpoints: {
      auth: `${API}/auth`,
      users: `${API}/users`,
      shops: `${API}/shops`,
      products: `${API}/products`,
      orders: `${API}/orders`,
      payments: `${API}/payments`,
      delivery: `${API}/delivery`,
      reviews: `${API}/reviews`,
    },
  });
});

// ============================================================
//  404 HANDLER
// ============================================================
app.use((req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: [${req.method}] ${req.originalUrl}`,
  });
});

// ============================================================
//  GLOBAL ERROR HANDLER
// ============================================================
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Mongoose Bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB Duplicate Key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value for "${field}"`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Log server errors
  if (statusCode >= 500) {
    console.error(
      `[${req.method}] ${req.originalUrl} → ${statusCode}:`,
      err.stack,
    );
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
