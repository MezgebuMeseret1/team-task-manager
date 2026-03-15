import Notification from "../models/Notification.js";

export const createNotification = async ({
  recipient,
  message,
  type = "system",
  link = "",
}) => {
  try {
    await Notification.create({
      recipient,
      message,
      type,
      link,
      read: false,
    });
  } catch (error) {
    console.error("Notification error:", error);
  }
};