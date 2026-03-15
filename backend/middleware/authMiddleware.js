import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  let token;

  // 1️⃣ Check if Authorization header exists
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    console.warn("No token provided for request:", req.originalUrl);
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3️⃣ Fetch user from DB
    const user = await User.findById(decoded.id).select("-password");
    if (!user || user.isDeleted) {
      console.warn("Token valid but user not found or deleted:", decoded.id);
      return res.status(401).json({ message: "User no longer exists" });
    }

    // 4️⃣ Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};