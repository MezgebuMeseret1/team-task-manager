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

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

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
  windowMs: 15 * 60 * 1000,
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
app.use("/api/v1/audit", auditRoutes);
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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Optional: handle client join rooms for specific userId
  socket.on("join", (userId) => {
    socket.join(userId); // rooms by userId
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(
    `Server running in ${
      process.env.NODE_ENV || "development"
    } mode on port ${PORT}`
  );
});