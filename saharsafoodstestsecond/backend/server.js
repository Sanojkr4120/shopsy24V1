import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js"; // Import cached connection logic

import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import areaRoutes from "./routes/areaRoutes.js";
import centerRoutes from "./routes/centerRoutes.js";
import pincodeRoutes from "./routes/pincodeRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
];

// Dynamic CORS Configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches Vercel preview URLs
    if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['polling', 'websocket'],
  path: '/socket.io/'
});

// Database Connection Middleware for Serverless
app.use(async (req, res, next) => {
  if (req.path.startsWith('/socket.io')) return next(); // Skip DB for socket handshake if preferred, but usually needed for session
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database Connection Failed inside Middleware:", err);
    res.status(500).json({ message: "Database Connection Error" });
  }
});

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());

// Explicitly handle Socket.IO polling requests for Serverless environment
// Vercel only exports 'app', so we must route socket requests manually to the engine.
app.all('/socket.io/*', (req, res) => {
  io.engine.handleRequest(req, res);
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Make io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/centers", centerRoutes);
app.use("/api/pincodes", pincodeRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "1") {
  // Only connect explicitly if not in serverless mode (serverless uses caching middleware)
  connectDB().then(() => {
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error("Local DB Connect Error:", err);
  });
}

export default app;
