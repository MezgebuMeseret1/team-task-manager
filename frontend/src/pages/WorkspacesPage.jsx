import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import WorkspaceList from "../components/Workspaces/WorkspaceList";
import WorkspaceForm from "../components/Workspaces/WorkspaceForm";

const WorkspacesPage = () => {
  const { user } = useContext(AuthContext);
  const { data: workspaces, loading, error, refetch } = useFetch("/workspaces");

  const [showForm, setShowForm] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);

  if (!["admin", "operator"].includes(user?.role)) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-xl font-semibold">
          Access Denied. Admins & Operators only.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-8xl mx-auto">
      {/* Header */}

      {/* Loading/Error */}
      {loading && (
        <p className="text-gray-500 text-center py-6">Loading workspaces...</p>
      )}
      {error && <p className="text-red-500 text-center py-6">{error}</p>}

      {/* Workspace List */}
      {workspaces && workspaces.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden border">
          <WorkspaceList
            workspaces={workspaces}
            onEdit={(workspace) => {
              setEditingWorkspace(workspace);
              setShowForm(true);
            }}
            onUpdate={refetch}
          />
        </div>
      ) : (
        !loading && (
          <p className="text-gray-500 text-center py-6">No workspaces found.</p>
        )
      )}

      {/* Workspace Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={() => {
                setShowForm(false);
                setEditingWorkspace(null);
              }}
            >
              &times;
            </button>
            <WorkspaceForm
              workspace={editingWorkspace}
              onClose={() => {
                setShowForm(false);
                setEditingWorkspace(null);
                refetch();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacesPage;