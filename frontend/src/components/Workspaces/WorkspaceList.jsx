import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import WorkspaceForm from "./WorkspaceForm";

const WorkspaceList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [filteredWorkspaces, setFilteredWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await API.get("/workspaces");
      setWorkspaces(response.data);
      setFilteredWorkspaces(response.data); // initialize filtered list
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = workspaces.filter(
      (w) =>
        w.name.toLowerCase().includes(term) ||
        w.description?.toLowerCase().includes(term)
    );
    setFilteredWorkspaces(filtered);
    setCurrentPage(1); // reset to first page on search
  }, [searchTerm, workspaces]);

  const handleEdit = (workspace) => {
    setEditingWorkspace(workspace);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await API.delete(`/workspaces/${id}`);
      fetchWorkspaces();
    } catch (err) {
      console.error("Failed to delete workspace:", err);
    }
  };

  const handleFormClose = () => {
    setEditingWorkspace(null);
    setShowForm(false);
    fetchWorkspaces();
  };

  // Pagination logic
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentWorkspaces = filteredWorkspaces.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredWorkspaces.length / rowsPerPage);

  const handlePageChange = (page) => setCurrentPage(page);
  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  if (!["admin", "operator"].includes(user?.role)) {
    return <div>Access Denied: Admin/Operator only</div>;
  }

  return (
    <div className="p-6">
      {/* Top controls */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
        >
          Back to Dashboard
        </button>

        <h2 className="text-2xl font-bold">Workspaces</h2>

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Add Workspace
        </button>
      </div>

      {/* Search + Rows per page */}
      <div className="flex justify-between items-center mb-2 gap-2">
        <input
          type="text"
          placeholder="Search by name or description..."
          className="border px-3 py-1 rounded w-80"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <label>Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={handleRowsChange}
            className="border rounded px-2 py-1"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {showForm && (
        <WorkspaceForm workspace={editingWorkspace} onClose={handleFormClose} />
      )}

      {loading ? (
        <p>Loading workspaces...</p>
      ) : (
        <>
          <table className="min-w-full border bg-white rounded shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentWorkspaces.map((w) => (
                <tr key={w._id} className="border-t">
                  <td className="px-4 py-2">{w.name}</td>
                  <td className="px-4 py-2">{w.description}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(w)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(w._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {currentWorkspaces.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center py-4">
                    No workspaces found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === num ? "bg-blue-600 text-white" : "bg-white hover:bg-gray-200"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WorkspaceList;