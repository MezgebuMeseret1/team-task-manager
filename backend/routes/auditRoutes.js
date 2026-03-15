import express from "express";
import { getAuditLogs } from "../controllers/auditController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* Admin only */
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAuditLogs
);

export default router;