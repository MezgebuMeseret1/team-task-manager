import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import TaskList from "../components/Tasks/TaskList";
import TaskForm from "../components/Tasks/TaskForm";

const TasksPage = () => {
  const { user } = useContext(AuthContext);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Backend endpoint auto-filters tasks by role
  const endpoint = "/tasks";
  const { data: tasks, loading, error, refetch } = useFetch(endpoint);

  const isAdminOrOperator = ["admin", "operator"].includes(user.role);

  const handleCreateClick = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTask(null);
    refetch();
  };

  return (
    <div className="p-8 max-w-8xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Task Management</h1>

      {/* Task Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={handleFormClose}
            >
              &times;
            </button>
            <TaskForm
              task={editingTask}
              onClose={handleFormClose}
              onSuccess={refetch}
              user={user} // needed for role-based logic in the form
            />
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white shadow rounded-lg overflow-hidden border p-4">
        {loading && (
          <p className="text-gray-500 text-center py-6">Loading tasks...</p>
        )}
        {error && (
          <p className="text-red-500 text-center py-6">{error}</p>
        )}
        {tasks && tasks.length > 0 ? (
          <TaskList
            tasks={tasks}
            userRole={user.role}
            onEdit={handleEditClick}
            onUpdate={refetch}
          />
        ) : (
          !loading && (
            <p className="text-gray-500 text-center py-6">No tasks found.</p>
          )
        )}
      </div>

      {/* Create Task Button (Admins/Operators only) */}
      {isAdminOrOperator && (
        <div className="mt-4 flex justify-end">
          
        </div>
      )}
    </div>
  );
};

export default TasksPage;