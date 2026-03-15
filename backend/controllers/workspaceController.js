import Workspace from "../models/Workspace.js";

/* CREATE WORKSPACE */
export const createWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.create({
      name: req.body.name,
      description: req.body.description,
      createdBy: req.user._id,
      members: req.body.members?.length
        ? req.body.members
        : [req.user._id], // ensure creator is member
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("CREATE WORKSPACE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* GET WORKSPACES */
export const getWorkspaces = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "operator") {
      filter.createdBy = req.user._id;
    }

    if (req.user.role === "user") {
      filter.members = req.user._id;
    }

    const workspaces = await Workspace.find(filter)
      .populate("createdBy", "name email")
      .populate("members", "name email");

    res.json(workspaces);
  } catch (error) {
    console.error("GET WORKSPACES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* UPDATE WORKSPACE */
export const updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    Object.assign(workspace, req.body);
    await workspace.save();

    res.json(workspace);
  } catch (error) {
    console.error("UPDATE WORKSPACE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* DELETE WORKSPACE (Soft Delete) */
export const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    workspace.isDeleted = true;
    await workspace.save();

    res.json({ message: "Workspace deleted" });
  } catch (error) {
    console.error("DELETE WORKSPACE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};