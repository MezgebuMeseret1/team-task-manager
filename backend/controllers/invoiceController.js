import Invoice from "../models/Invoice.js";
import Task from "../models/Task.js";
import { generateInvoiceNumber } from "../utils/generateInvoiceNumber.js";
import Notification from "../models/Notification.js";
import { io } from "../server.js";
import { logAction } from "../middleware/auditMiddleware.js";
/* =========================
   Create Invoice (SaaS-ready)
========================= */
export const createInvoice = async (req, res) => {
  try {
    const { task: taskId, description } = req.body;

    if (!taskId) return res.status(400).json({ message: "Task is required" });

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.status !== "completed") return res.status(400).json({ message: "Only completed tasks can be invoiced" });
    if (task.isInvoiced) return res.status(400).json({ message: "Invoice already created for this task" });

    const amount = task.hours * task.rate || req.body.amount || 0;

    const invoice = await Invoice.create({
      invoiceNumber: generateInvoiceNumber(),
      task: task._id,
      amount,
      description: description || `Invoice for task: ${task.title}`,
      status: "draft",
      createdBy: req.user._id,
    });

    task.isInvoiced = true;
    await task.save();
await logAction({
  userId: req.user._id,
  entity: "Invoice",
  entityId: invoice._id,
  action: "CREATE",
  metadata: {
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.amount,
  },
  ip: req.ip,
});
    // Notify assigned user or task creator
    const recipientId = task.assignedTo || task.createdBy;
    const notif = await Notification.create({
      recipient: recipientId,
      title: "Invoice Created",
      message: `Invoice ${invoice.invoiceNumber} created for task: ${task.title}`,
      type: "invoice",
    });

    io.to(recipientId.toString()).emit("notification", notif);

    res.status(201).json(invoice);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invoice creation failed", error: err.message });
  }
};

/* =========================
   Get Invoices
========================= */
export const getInvoices = async (req, res) => {
  try {
    let filter = { isDeleted: { $ne: true } };
    if (req.user.role === "user") filter.createdBy = req.user._id;

    const invoices = await Invoice.find(filter)
      .populate("task")
      .populate("createdBy", "name email role");

    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch invoices" });
  }
};

/* =========================
   Submit Invoice (Draft → Pending)
========================= */
export const submitInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    invoice.status = "pending";
    await invoice.save();
await logAction({
  userId: req.user._id,
  entity: "Invoice",
  entityId: invoice._id,
  action: "UPDATE",
  metadata: { status: "pending" },
  ip: req.ip,
});
    // Notify admins/operators
    const notif = await Notification.create({
      recipient: null, // broadcast to all admins/operators
      title: "Invoice Submitted",
      message: `Invoice ${invoice.invoiceNumber} submitted for review`,
      type: "invoice",
    });
    io.emit("notification", notif);

    res.json({ message: "Invoice submitted for approval" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit invoice" });
  }
};

/* =========================
   Review Invoice (Approve / Reject)
========================= */
export const reviewInvoice = async (req, res) => {
  try {
    if (!["admin", "operator"].includes(req.user.role))
      return res.status(403).json({ message: "Not authorized" });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (!["approved", "rejected"].includes(req.body.status))
      return res.status(400).json({ message: "Invalid status" });

    invoice.status = req.body.status;
    invoice.approvedBy = req.user._id;
    invoice.approvedAt = new Date();
    await invoice.save();
await logAction({
  userId: req.user._id,
  entity: "Invoice",
  entityId: invoice._id,
  action: req.body.status === "approved" ? "APPROVE" : "REJECT",
  metadata: {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
  },
  ip: req.ip,
});
    // Notify invoice creator
    const notif = await Notification.create({
      recipient: invoice.createdBy,
      title: "Invoice Review Update",
      message: `Invoice ${invoice.invoiceNumber} has been ${invoice.status}`,
      type: "invoice",
    });
    io.to(invoice.createdBy.toString()).emit("notification", notif);

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to review invoice" });
  }
};

/* =========================
   Mark As Paid (Admin Only)
========================= */
export const markAsPaid = async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Only admin can mark as paid" });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    invoice.status = "paid";
    await invoice.save();
await logAction({
  userId: req.user._id,
  entity: "Invoice",
  entityId: invoice._id,
  action: "UPDATE",
  metadata: { status: "paid" },
  ip: req.ip,
});
    const notif = await Notification.create({
      recipient: invoice.createdBy,
      title: "Invoice Paid",
      message: `Invoice ${invoice.invoiceNumber} has been marked as paid`,
      type: "invoice",
    });
    io.to(invoice.createdBy.toString()).emit("notification", notif);

    res.json({ message: "Invoice marked as paid" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to mark invoice as paid" });
  }
};

/* =========================
   Update Invoice
========================= */
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    // Normal user can edit only their own invoice
    if (req.user.role === "user" && invoice.createdBy.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // Normal users cannot change status
    if (req.body.status && !["admin", "operator"].includes(req.user.role)) delete req.body.status;

    const allowedFields = ["description", "amount", "task", "status"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) invoice[field] = req.body[field];
    });

    await invoice.save();

    // Notify creator if admin/operator updated
    if (["admin", "operator"].includes(req.user.role)) {
      const notif = await Notification.create({
        recipient: invoice.createdBy,
        title: "Invoice Updated",
        message: `Your invoice ${invoice.invoiceNumber} has been updated by ${req.user.name}`,
        type: "invoice",
      });
      io.to(invoice.createdBy.toString()).emit("notification", notif);
    }

    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update invoice" });
  }
};

/* =========================
   Soft Delete Invoice
========================= */
export const deleteInvoice = async (req, res) => {
  try {
    if (!["admin", "operator"].includes(req.user.role))
      return res.status(403).json({ message: "Not authorized" });

    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    invoice.isDeleted = true;
    await invoice.save();

    // Notify creator about deletion
    const notif = await Notification.create({
      recipient: invoice.createdBy,
      title: "Invoice Deleted",
      message: `Your invoice ${invoice.invoiceNumber} has been deleted by ${req.user.name}`,
      type: "invoice",
    });
    io.to(invoice.createdBy.toString()).emit("notification", notif);

    res.json({ message: "Invoice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete invoice" });
  }
};