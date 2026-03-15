import React, { useContext, useState, useEffect } from "react";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";

const InvoiceForm = ({ invoice, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState(invoice?.task?._id || "");
  const [description, setDescription] = useState(invoice?.description || "");
  const [amount, setAmount] = useState(invoice?.amount || 0);
  const [status, setStatus] = useState(invoice?.status || "draft");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch tasks for invoicing
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const endpoint =
          user.role === "user"
            ? `/tasks?assignedTo=${user._id}`
            : "/tasks";

        const res = await API.get(endpoint);

        // Only completed tasks and not yet invoiced
        const availableTasks = invoice
          ? res.data // editing: allow current task
          : res.data.filter((t) => t.status === "completed" && !t.isInvoiced);

        setTasks(availableTasks);
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
        setError("Failed to load tasks");
      }
    };

    fetchTasks();
  }, [user, invoice]);

  // Auto-calculate amount when selecting a task
  useEffect(() => {
    if (!taskId) return;
    const selectedTask = tasks.find((t) => t._id === taskId);
    if (selectedTask) setAmount(selectedTask.hours * selectedTask.rate || 0);
  }, [taskId, tasks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!taskId) {
      setError("Please select a task");
      return;
    }

    if (amount < 0) {
      setError("Amount must be non-negative");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        task: taskId,
        description,
        amount: Number(amount),
        createdBy: user._id,
      };

      // Only Admin/Operator can set status
      if (invoice && ["admin", "operator"].includes(user.role)) {
        payload.status = status;
      } else if (!invoice) {
        payload.status = "draft";
      }

      if (invoice) {
        await API.put(`/invoices/${invoice._id}`, payload);
      } else {
        await API.post("/invoices", payload);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-xl font-bold mb-4">
          {invoice
            ? "Edit Invoice"
            : user.role === "user"
            ? "Create Invoice"
            : "Add Invoice"}
        </h2>

        {error && <div className="text-red-500 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Task dropdown */}
          <div>
            <label className="block mb-1 font-medium">Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full border px-3 py-2 rounded"
              required
              disabled={!!invoice} // cannot change task when editing
            >
              <option value="">Select a task</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.workspace?.name || "No workspace"}) — {t.hours}h × ${t.rate}/h
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-1 font-medium">Amount</label>
            <input
              type="number"
              value={amount}
              readOnly={user.role === "user"} // users cannot edit amount
              className={`w-full border px-3 py-2 rounded ${
                user.role === "user" ? "bg-gray-100" : ""
              }`}
            />
          </div>

          {/* Status (Admin/Operator) */}
          {invoice && ["admin", "operator"].includes(user.role) && (
            <div>
              <label className="block mb-1 font-medium">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Saving..." : invoice ? "Update Invoice" : "Save Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceForm;