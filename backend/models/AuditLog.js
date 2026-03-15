import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "APPROVE", "REJECT"],
    },
    entity: {
      type: String,
      required: true,
      enum: ["User", "Workspace", "Task", "Invoice"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ipAddress: String,
  },
  { timestamps: true }
);

// Indexes for faster queries
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model("AuditLog", auditLogSchema);