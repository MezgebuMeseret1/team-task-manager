
/* Admin only */
import AuditLog from "../models/AuditLog.js";

/* Admin only */
export const getAuditLogs = async (req, res) => {
  try {
    // Optional: support query params for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Optional: filter by search term
    const search = req.query.search || "";
    const searchRegex = new RegExp(search, "i"); // case-insensitive

    const logs = await AuditLog.find({
      $or: [
        { action: searchRegex },
        { entity: searchRegex },
        { "metadata.name": searchRegex }, // optional metadata search
      ],
    })
      .populate("user", "name email") // only populate necessary fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments({
      $or: [
        { action: searchRegex },
        { entity: searchRegex },
        { "metadata.name": searchRegex },
      ],
    });

    res.status(200).json({
      logs,
      page,
      totalPages: Math.ceil(total / limit),
      totalLogs: total,
    });
  } catch (err) {
    console.error("Failed to fetch audit logs:", err);
    res.status(500).json({ message: "Failed to fetch audit logs" });
  }
};