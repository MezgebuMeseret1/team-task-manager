import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import UserForm from "./UserForm";

const UserList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5); // default 5

  const fetchUsers = async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Search/filter users
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // reset page on search
  }, [searchTerm, users]);

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handlePerPageChange = (e) => {
    setUsersPerPage(Number(e.target.value));
    setCurrentPage(1); // reset page
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/users/${id}`);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  const handleFormClose = () => {
    setEditingUser(null);
    setShowForm(false);
    fetchUsers();
  };

  if (user?.role !== "admin") {
    return <div>Access Denied: Admins only</div>;
  }

  return (
    <div className="p-6">
      {/* Top controls: Back + Add User + Search */}
      <div className="flex justify-between items-center mb-4 gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition"
        >
          Back to Dashboard
        </button>

        <input
          type="text"
          placeholder="Search users..."
          className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 w-80"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
         + Add User
        </button>
      </div>

      {showForm && <UserForm user={editingUser} onClose={handleFormClose} />}

      {/* Rows per page selector */}
      <div className="flex justify-end mb-2 items-center gap-2">
        <label>Rows per page:</label>
        <select
          value={usersPerPage}
          onChange={handlePerPageChange}
          className="border rounded px-2 py-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {loading ? (
        <p>Loading users...</p>
      ) : (
        <>
          <table className="min-w-full border bg-white rounded shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.active ? "Active" : "Deactivated"}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(u)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(u._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {currentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination controls */}
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

export default UserList;