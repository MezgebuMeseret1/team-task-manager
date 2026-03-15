// backend/controllers/notificationController.js
import Notification from "../models/Notification.js";

// Fetch user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Mark single notification as read
export const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { returnDocument: "after" } // fixes deprecation warning
    );

    if (!notif) return res.status(404).json({ error: "Notification not found" });

    res.json({ success: true, notification: notif });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
};

// Create a notification safely
export const createNotification = async ({ recipientId, message, type = "system", link }, io) => {
  if (!recipientId || !message) throw new Error("recipientId and message are required");

  const notification = await Notification.create({
    recipient: recipientId,
    message,
    type,
    link,
  });

  // Emit real-time notification via Socket.IO
  if (io && recipientId) {
    io.to(recipientId.toString()).emit("new_notification", notification);
  }

  return notification;
};