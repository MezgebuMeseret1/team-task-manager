import Task from "../models/Task.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { io } from "../server.js";
import { createNotification } from "./notificationController.js";
import { logAction } from "../middleware/auditMiddleware.js";
/* =========================
   CREATE Task (Admin/Operator only)
========================= */
export const createTask = async (req, res) => {
  try {
    if (!["admin", "operator"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin or operator can create tasks",
      });
    }

    const task = await Task.create({
      ...req.body,
      createdBy: req.user._id,
      status: "todo",
    });
    await logAction({
  userId: req.user._id,
  entity: "Task",
  entityId: task._id,
  action: "CREATE",
  metadata: { title: task.title },
  ip: req.ip,
});

    /* Notify assigned user */
    if (task.assignedTo) {
      const notif = await Notification.create({
        recipient: task.assignedTo,
        type: "task-assigned",
        message: `New task assigned: "${task.title}"`,
        link: `/tasks/${task._id}`,
      });

      io.to(task.assignedTo.toString()).emit("notification", notif);
    }

    res.status(201).json(task);
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ message: "Failed to create task" });
  }
};

/* =========================
   GET Tasks (Role Based)
========================= */
export const getTasks = async (req, res) => {
  try {
    const filter =
      req.user.role === "user"
        ? { assignedTo: req.user._id, isDeleted: false }
        : { isDeleted: false };

    const tasks = await Task.find(filter)
      .populate("workspace", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("invoice", "invoiceNumber status amount");

    res.json(tasks);
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

/* =========================
   UPDATE Task
========================= */
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).populate("assignedTo");

    if (!task) return res.status(404).json({ message: "Task not found" });

    const prevStatus = task.status;
    const prevAssigned = task.assignedTo?._id?.toString();

    const userId = req.user._id.toString();
    const userRole = req.user.role;

    if (task.invoice) {
      return res.status(400).json({
        message: "Task already invoiced and cannot be modified",
      });
    }

    /* =========================
       NORMAL USER LOGIC
    ========================= */
    if (userRole === "user") {
      if (!prevAssigned || prevAssigned !== userId) {
        return res.status(403).json({
          message: "You are not assigned to this task",
        });
      }

      const validStatuses = ["todo", "in-progress", "completed", "rejected"];

      if (req.body.status) {
        if (!validStatuses.includes(req.body.status)) {
          return res.status(400).json({ message: "Invalid status value" });
        }

        task.status = req.body.status;
        if (req.body.status === "completed") task.completedAt = new Date();
      }

      ["billable", "hours", "rate"].forEach((field) => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      await task.save();
  await logAction({
    userId: req.user._id,
    entity: "Task",
    entityId: task._id,
     action: "UPDATE",
    metadata: req.body,
     ip: req.ip,
       });
      /* Notify admins/operators on completion or rejection */
      if (task.status !== prevStatus && ["completed", "rejected"].includes(task.status)) {
        const admins = await User.find({ role: { $in: ["admin", "operator"] } });
        for (const admin of admins) {
          await createNotification(
            {
              recipientId: admin._id,
              type: "task-status-changed",
              message: `Task "${task.title}" was marked ${task.status} by ${req.user.name}`,
              link: `/tasks/${task._id}`,
            },
            req.io
          );
        }
      }

      return res.json(task);
    }

    /* =========================
       ADMIN / OPERATOR LOGIC
    ========================= */
    if (["admin", "operator"].includes(userRole)) {
      const allowedFields = [
        "title",
        "description",
        "workspace",
        "assignedTo",
        "dueDate",
        "status",
        "priority",
        "rate",
        "billable",
        "hours",
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) task[field] = req.body[field];
      });

      if (req.body.status === "completed") task.completedAt = new Date();

      await task.save();
    await logAction({
  userId: req.user._id,
  entity: "Task",
  entityId: task._id,
  action: "UPDATE",
  metadata: req.body,
  ip: req.ip,
});
      const newAssigned = task.assignedTo?._id?.toString();

      /* Notify if reassigned */
      if (newAssigned && newAssigned !== prevAssigned) {
        await createNotification(
          {
            recipientId: newAssigned,
            type: "task-assigned",
            message: `You have been assigned task "${task.title}"`,
            link: `/tasks/${task._id}`,
          },
          req.io
        );
      }

      /* Notify assigned user of update */
      if (newAssigned) {
        await createNotification(
          {
            recipientId: newAssigned,
            type: "task-updated",
            message: `Task "${task.title}" updated by ${req.user.name}`,
            link: `/tasks/${task._id}`,
          },
          req.io
        );
      }

      return res.json(task);
    }

    res.status(403).json({ message: "Not authorized" });
  } catch (err) {
    console.error(`[UPDATE] Failed to update task ${req.params.id}`, err);
    res.status(500).json({ message: "Failed to update task" });
  }
};

/* =========================
   DELETE Task (Soft Delete)
========================= */
export const deleteTask = async (req, res) => {
  try {
    if (!["admin", "operator"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Only admin or operator can delete tasks",
      });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    
task.isDeleted = true;
await task.save();

await logAction({
  userId: req.user._id,
  entity: "Task",
  entityId: task._id,
  action: "DELETE",
  metadata: { title: task.title },
  ip: req.ip,
});
    if (task.assignedTo) {
      const notif = await Notification.create({
        recipient: task.assignedTo,
        type: "task-deleted",
        message: `Task "${task.title}" was deleted by ${req.user.name}`,
        link: `/tasks`,
      });

      io.to(task.assignedTo.toString()).emit("notification", notif);
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error(`[DELETE] Failed to delete task ${req.params.id}`, err);
    res.status(500).json({ message: "Failed to delete task" });
  }
};