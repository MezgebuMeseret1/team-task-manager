import express from "express";
import {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  getMyProfile,
} from "../controllers/userController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ---------------- Normal User ---------------- */
// Get own profile
router.get("/me", protect, getMyProfile);

/* ---------------- Admin Only ---------------- */
// Create a new user
router.post("/", protect, authorizeRoles("admin"), createUser);

// Get all users
router.get("/", protect, authorizeRoles("admin"), getUsers);

// Update a user by ID
router.put("/:id", protect, authorizeRoles("admin"), updateUser);

// Delete a user by ID
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

export default router;