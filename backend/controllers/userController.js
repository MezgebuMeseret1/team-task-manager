import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

/* =========================
   CREATE USER (Admin Only)
========================= */
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User with this email already exists" });
  }

  try {
    const user = await User.create({
      name,
      email,
      password,
      role, // 'admin', 'operator', 'user'
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================
   GET ALL USERS (Admin)
========================= */
export const getUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

/* =========================
   UPDATE USER (Admin)
========================= */
export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.name = req.body.name || user.name;
  user.role = req.body.role || user.role;
  user.isActive =
    req.body.isActive !== undefined ? req.body.isActive : user.isActive;

  await user.save();
  res.json(user);
};

/* =========================
   SOFT DELETE USER (Admin)
========================= */
export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.isDeleted = true;
  await user.save();
  res.json({ message: "User soft deleted" });
};

/* =========================
   GET LOGGED-IN USER PROFILE
========================= */
export const getMyProfile = async (req, res) => {
  res.json(req.user);
};