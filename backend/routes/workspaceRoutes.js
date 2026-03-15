import express from "express";
import {
  createWorkspace,
  getWorkspaces,
  updateWorkspace,
  deleteWorkspace,
} from "../controllers/workspaceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* Admin + Operator */
router.post(
  "/",
  protect,
  authorizeRoles("admin", "operator"),
  createWorkspace
);

/* All roles can view based on filter */
router.get("/", protect, getWorkspaces);

/* Admin + Operator */
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "operator"),
  updateWorkspace
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("admin", "operator"),
  deleteWorkspace
);

export default router;