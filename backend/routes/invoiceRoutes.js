import express from "express";
import {
  createInvoice,
  getInvoices,
  updateInvoice,
  submitInvoice,
  reviewInvoice,
  markAsPaid,
  deleteInvoice,
} from "../controllers/invoiceController.js";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* =========================
   Create Invoice
   - Users/Admin/Operator can create
   - Prevents duplicate invoice for same task in controller
========================= */
router.post(
  "/",
  protect,
  authorizeRoles("admin", "operator", "user"),
  createInvoice
);

/* =========================
   Get Invoices
   - Role filtered in controller
========================= */
router.get("/", protect, getInvoices);

/* =========================
   Update Invoice
   - Users can edit their own
   - Admin/Operator can edit any
========================= */
router.put(
  "/:id",
  protect,
  authorizeRoles("admin", "operator", "user"),
  updateInvoice
);

/* =========================
   Submit Draft → Pending
   - Only invoice owner (user) can submit
========================= */
router.put(
  "/:id/submit",
  protect,
  authorizeRoles("user"),
  submitInvoice
);

/* =========================
   Review Invoice (Approve / Reject)
   - Operator/Admin only
========================= */
router.put(
  "/:id/review",
  protect,
  authorizeRoles("operator", "admin"),
  reviewInvoice
);

/* =========================
   Mark As Paid
   - Admin only
========================= */
router.put(
  "/:id/pay",
  protect,
  authorizeRoles("admin"),
  markAsPaid
);

/* =========================
   Soft Delete Invoice
   - Admin only
========================= */
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  deleteInvoice
);

export default router;