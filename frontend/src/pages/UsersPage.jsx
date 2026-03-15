import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import UserList from "../components/Users/UserList";
import UserForm from "../components/Users/UserForm";

const UsersPage = () => {
  const { user } = useContext(AuthContext);
  const { data: users, loading, error, refetch } = useFetch("/users");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Only Admin can access
  if (user?.role !== "admin") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-xl font-semibold">Access Denied. Admins only.</p>
      </div>
    );
  }

  const handleAddUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleSaved = () => {
    refetch(); // refresh list
    setShowForm(false);
    setEditingUser(null);
  };

  return (
    <div className="p-8 max-w-8xl mx-auto">
      {/* Loading/Error */}
      {loading && <p className="text-gray-500 text-center py-6">Loading users...</p>}
      {error && <p className="text-red-500 text-center py-6">{error}</p>}

      {/* User List */}
      {users && users.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden border">
          <UserList users={users} onEdit={handleEditUser} />
        </div>
      ) : (
        !loading && (
          <p className="text-gray-500 text-center py-6">No users found.</p>
        )
      )}

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={handleCloseForm}
            >
              &times;
            </button>
            <UserForm user={editingUser} onClose={handleCloseForm} onSaved={handleSaved} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;