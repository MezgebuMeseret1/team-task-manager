import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

/* =========================
   Public Routes
========================= */

// Register a new user
// POST /api/v1/auth/register
router.post("/register", register);

// Login a user
// POST /api/v1/auth/login
router.post("/login", login);

export default router;