import React, { useState } from "react";
import API from "../../api/api";

const UserForm = ({ user, onClose, onSaved }) => {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(user?.role || "user");
  const [active, setActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (user) {
        await API.put(`/users/${user._id}`, { name, email, role, isActive: active });
      } else {
        await API.post("/users", { name, email, password, role });
      }

      if (onSaved) onSaved(); // Refresh parent list
      onClose(); // Close modal
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={onClose} // Clicking outside modal closes it
    >
      <div
        className="bg-white p-6 rounded shadow w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()} // Stop overlay click from triggering onClose
      >
        <h2 className="text-xl font-bold mb-4">{user ? "Edit User" : "Add User"}</h2>

        {error && <div className="text-red-500 mb-3">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {!user && (
            <div>
              <label className="block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          )}

          <div>
            <label className="block mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            >
              <option value="user">Normal User</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {user && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <label>Active</label>
            </div>
          )}

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
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;