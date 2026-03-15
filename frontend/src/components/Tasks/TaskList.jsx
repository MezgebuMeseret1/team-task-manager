import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import TaskForm from "./TaskForm";

const TaskList = ({ onStatsUpdate, hideTable = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tasksPerPage, setTasksPerPage] = useState(5);

  const statusColors = {
    todo: "bg-yellow-100",
    "in-progress": "bg-blue-100",
    completed: "bg-green-100",
    rejected: "bg-red-100",
  };

  // ---------------- FETCH TASKS ----------------
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await API.get("/tasks");
      let activeTasks = res.data.filter((t) => !t.isDeleted);

      // ---------------- FILTER TASKS FOR NORMAL USERS ----------------
      if (user.role === "user") {
        activeTasks = activeTasks.filter(
          (t) => t.createdBy?._id === user._id || t.assignedTo?._id === user._id
        );
      }

      setTasks(activeTasks);
      setFilteredTasks(activeTasks);

      // ---------------- UPDATE DASHBOARD STATS ----------------
      if (onStatsUpdate) {
        const counts = activeTasks.reduce((acc, t) => {
          const key = t.status === "in-progress" ? "in progress" : t.status;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, { todo: 0, "in progress": 0, completed: 0, rejected: 0 });

        const monthlyCounts = {};
        activeTasks.forEach((t) => {
          if (!t.createdAt) return;
          const d = new Date(t.createdAt);
          const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        });

        const tasksMonthly = Object.entries(monthlyCounts)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month));

        onStatsUpdate((prev) => ({ ...prev, tasks: counts, tasksMonthly }));
      }
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ---------------- SEARCH FILTER ----------------
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.workspace?.name?.toLowerCase().includes(term) ||
        t.assignedTo?.name?.toLowerCase().includes(term) ||
        t.createdBy?.name?.toLowerCase().includes(term)
    );
    setFilteredTasks(filtered);
    setCurrentPage(1);
  }, [searchTerm, tasks]);

  // ---------------- TASK ACTIONS ----------------
  const handleEdit = (task) => {
    if (!["admin", "operator"].includes(user.role)) return;
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!["admin", "operator"].includes(user.role)) return;
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await API.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await API.put(`/tasks/${task._id}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleFormClose = () => {
    setEditingTask(null);
    setShowForm(false);
    fetchTasks();
  };

  // ---------------- PAGINATION ----------------
  const indexOfLast = currentPage * tasksPerPage;
  const indexOfFirst = indexOfLast - tasksPerPage;
  const currentTasks = filteredTasks.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

  if (hideTable) return null;

  return (
    <div className="p-6">
      {/* Top Controls */}
      <div className="flex justify-between mb-4 items-center gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
        >
          Back
        </button>

        {["admin", "operator"].includes(user.role) && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Add Task
          </button>
        )}

        <input
          type="text"
          placeholder="Search tasks..."
          className="border px-3 py-1 rounded w-80"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={handleFormClose}
          onSuccess={handleFormClose}
        />
      )}

      {/* Pagination control */}
      <div className="flex justify-end mb-2 items-center gap-2">
        <label>Rows:</label>
        <select
          value={tasksPerPage}
          onChange={(e) => {
            setTasksPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border rounded px-2 py-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
        </select>
      </div>

      {/* Task Table */}
      {loading ? (
        <p>Loading tasks...</p>
      ) : currentTasks.length === 0 ? (
        <p className="text-center py-4 text-gray-500">No tasks found.</p>
      ) : (
        <table className="min-w-full border bg-white rounded shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Workspace</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Billable</th>
              <th className="px-4 py-2">Hours</th>
              <th className="px-4 py-2">Rate</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created Date</th>
              <th className="px-4 py-2">Due Date</th>
              <th className="px-4 py-2">Task Owner</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentTasks.map((t) => {
              const amount = (t.hours || 0) * (t.rate || 0);
              const isOverdue =
                t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed";

              return (
                <tr key={t._id} className="border-t">
                  <td className="px-4 py-2">{t.title}</td>
                  <td className="px-4 py-2">{t.workspace?.name || "-"}</td>
                  <td className="px-4 py-2">{t.priority}</td>
                  <td className="px-4 py-2">{t.billable ? "Yes" : "No"}</td>
                  <td className="px-4 py-2">{t.hours || "-"}</td>
                  <td className="px-4 py-2">{t.rate ? `$${t.rate}` : "-"}</td>
                  <td className="px-4 py-2 font-semibold">{t.billable ? `$${amount}` : "-"}</td>
                  <td className={`px-4 py-2 ${statusColors[t.status] || ""}`}>
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t, e.target.value)}
                      className="border px-2 py-1 rounded"
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td className={`px-4 py-2 ${isOverdue ? "bg-red-200" : ""}`}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className={`px-4 py-2 ${isOverdue ? "bg-red-200" : ""}`}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2">{t.createdBy?.name || "-"}</td>
                  <td className="px-4 py-2 space-x-1 flex">
                    {["admin", "operator"].includes(user.role) && (
                      <>
                        <button
                          onClick={() => handleEdit(t)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded flex items-center justify-center"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(t._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded flex items-center justify-center"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination buttons */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 border rounded ${
                currentPage === num ? "bg-blue-600 text-white" : "bg-white"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;