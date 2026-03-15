import React, { useState, useEffect, useContext } from "react";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

const TaskForm = ({ task, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);

  // Task fields
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState(task?.priority || "medium");
  const [workspaceId, setWorkspaceId] = useState(task?.workspace?._id || "");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : "");

  // Billing fields
  const [billable, setBillable] = useState(task?.billable || false);
  const [hours, setHours] = useState(task?.hours || 0);
  const [rate, setRate] = useState(task?.rate || 0);

  // Related data
  const [workspaces, setWorkspaces] = useState([]);
  const [users, setUsers] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch workspaces & users
  const fetchData = async () => {
    try {
      const wsRes = await API.get("/workspaces");
      setWorkspaces(wsRes.data);

      const usersRes = await API.get("/users");
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch workspaces/users:", err);
      setError("Failed to load workspaces or users");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (task && !task._id) {
      setError("Task ID is missing. Cannot update.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        priority,
        workspace: workspaceId,
        assignedTo: assignedTo || null,
        billable,
        hours,
        rate,
        dueDate: dueDate || null,
      };

      if (task) payload.status = status;

      if (task) {
        await API.put(`/tasks/${task._id}`, payload);
      } else {
        await API.post("/tasks", payload);
      }

      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      console.error("Error saving task:", err.response?.data || err);
      setError(err.response?.data?.message || err.message || "Failed to save task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {task ? "Edit Task" : "Add Task"}
        </h2>

        {error && <div className="text-red-500 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Title */}
          <div>
            <label className="block mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Description */}
          <div>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Workspace */}
          <div>
            <label>Workspace</label>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select workspace</option>
              {workspaces.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Assigned To */}
          {["admin", "operator"].includes(user.role) && (
            <div>
              <label>Assign To</label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Due Date */}
          <div>
            <label>Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Billable */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
            />
            <label>Billable Task</label>
          </div>

          {billable && (
            <>
              <div>
                <label>Hours</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>

              <div>
                <label>Hourly Rate</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            </>
          )}

          {/* Status */}
          {task && ["admin", "operator"].includes(user.role) && (
            <div>
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default TaskForm;