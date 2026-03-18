import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server as SocketIO } from "socket.io";

import connectDB from "./config/db.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

/* Routes */
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

/* Middleware */
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();

/* Connect to MongoDB */
connectDB();

const app = express();

/* =========================
   SECURITY MIDDLEWARES
========================= */
app.use(helmet());

/* =========================
   CORS CONFIG
   Allow local dev + production frontend
========================= */
const allowedOrigins = [
  "http://localhost:5173",
  "https://team-task-manager-48r1ejf2s-mezgebus-projects.vercel.app",
];

// Only push env if it exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);

      // ❗ DO NOT throw error → just reject silently
      return callback(null, false);
    },
    credentials: true,
  })
);

// ✅ Handle preflight requests
app.options("*", cors());
/* =========================
   BODY PARSER
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   LOGGING
========================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================
   RATE LIMITING
========================= */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);

/* =========================
   ROUTES
========================= */
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/workspaces", workspaceRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/audit", auditRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/notifications", notificationRoutes);

/* =========================
   404 HANDLER
========================= */
app.use(notFound);

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use(errorHandler);

/* =========================
   START SERVER WITH SOCKET.IO
========================= */
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
export const io = new SocketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
  );
});