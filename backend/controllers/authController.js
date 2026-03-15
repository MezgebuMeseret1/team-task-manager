import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { logAction } from "../middleware/auditMiddleware.js";
// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    console.log("Register route hit");
    console.log("Request body:", req.body);
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
  const user = await User.create({ name, email, password });

await logAction({
  userId: user._id,
  entity: "User",
  entityId: user._id,
  action: "CREATE",
  metadata: { email: user.email },
  ip: req.ip,
});

res.status(201).json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});
  } catch (error) {
    console.error("Register error:", error);
    next(error); // Pass to global error middleware
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    console.log("Login route hit");
    console.log("Request body:", req.body);
    const { email, password } = req.body;

    // Find user and include password for checking
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account deactivated" });
    }

    // Update last login
   user.lastLogin = new Date();
await user.save();

await logAction({
  userId: user._id,
  entity: "User",
  entityId: user._id,
  action: "LOGIN",
  metadata: { email: user.email },
  ip: req.ip,
});

res.json({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  token: generateToken(user._id),
});
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};