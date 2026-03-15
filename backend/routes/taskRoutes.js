import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   CREATE TASK
   Admin / Operator only
========================= */
router.post(
  "/",
  protect,
  authorizeRoles("admin", "operator"),
  createTask
);

/* =========================
   GET ALL TASKS
   All authenticated users
========================= */
router.get(
  "/",
  protect,
  getTasks
);

/* =========================
   UPDATE TASK
   Admin / Operator / Assigned User
========================= */
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "operator", "user"),
  updateTask
);

/* =========================
   DELETE TASK (Soft Delete)
   Admin / Operator only
========================= */
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "operator"),
  deleteTask
);

export default router;