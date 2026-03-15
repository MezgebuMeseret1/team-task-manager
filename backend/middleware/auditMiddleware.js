import AuditLog from "../models/AuditLog.js";

/**
 * Log user actions automatically.
 * Usage: call after creating/updating the resource in your controller.
 */
export const logAction = async ({ userId, entity, entityId, action, metadata = {}, ip }) => {
  try {
    if (!userId || !entity || !entityId || !action) return;

    await AuditLog.create({
      user: userId,
      entity,
      entityId,
      action,
      metadata,
      ipAddress: ip,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
};