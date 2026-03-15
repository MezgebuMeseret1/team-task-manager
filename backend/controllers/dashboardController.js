import User from "../models/User.js";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import Invoice from "../models/Invoice.js";
import Notification from "../models/Notification.js";

export const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user?._id;
    const isAdmin = req.user?.role === "admin";

    // Basic counts (admins only)
    const totalUsers = isAdmin ? await User.countDocuments() : undefined;
    const totalWorkspaces = isAdmin ? await Workspace.countDocuments() : undefined;

    // Task filter
    const taskFilter = isAdmin ? {} : { assignedTo: userId };

    const tasks = {
      todo: await Task.countDocuments({ ...taskFilter, status: "todo" }),
      "in progress": await Task.countDocuments({ ...taskFilter, status: "in-progress" }),
      completed: await Task.countDocuments({ ...taskFilter, status: "completed" }),
      rejected: await Task.countDocuments({ ...taskFilter, status: "rejected" }),
    };

    const pendingTasks = tasks["in progress"];
    const overdueTasks = await Task.countDocuments({
      ...taskFilter,
      dueDate: { $lt: new Date() },
      status: { $nin: ["completed", "rejected"] },
    });

    // Invoice filter
    const invoiceFilter = isAdmin ? {} : { user: userId };

    const invoices = {
      draft: await Invoice.countDocuments({ ...invoiceFilter, status: "draft" }),
      pending: await Invoice.countDocuments({ ...invoiceFilter, status: "pending" }),
      approved: await Invoice.countDocuments({ ...invoiceFilter, status: "approved" }),
      rejected: await Invoice.countDocuments({ ...invoiceFilter, status: "rejected" }),
      paid: await Invoice.countDocuments({ ...invoiceFilter, status: "paid" }),
    };

    const pendingInvoices = invoices.pending;

    // Notifications (user only)
    let unreadNotifications = 0;
    if (userId) {
      unreadNotifications = await Notification.countDocuments({
        recipient: userId,
        read: false,
      });
    }

    res.json({
      totalUsers,
      totalWorkspaces,
      pendingTasks,
      pendingInvoices,
      overdueTasks,
      unreadNotifications,
      tasks,
      invoices,
      tasksMonthly: [], // optional: fill with aggregation if needed
      invoicesMonthly: [],
      revenue: 0, // optional: calculate for admins
      pendingApprovals: invoices.pending || 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: error.message });
  }
};