import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import InvoiceList from "../components/Invoices/InvoiceList";
import InvoiceForm from "../components/Invoices/InvoiceForm";

const InvoicesPage = () => {
  const { user } = useContext(AuthContext);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Backend endpoint: auto filters by user role
  const endpoint = "/invoices";
  const { data: invoices, loading, error, refetch } = useFetch(endpoint);

  const handleCreateClick = () => {
    setEditingInvoice(null);
    setShowForm(true);
  };

  const handleEditClick = (invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInvoice(null);
    refetch();
  };

  return (
    <div className="p-8 max-w-8xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Invoice Management</h1>

      {/* Invoice Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl font-bold"
              onClick={handleFormClose}
            >
              &times;
            </button>
            <InvoiceForm
              invoice={editingInvoice}
              onClose={handleFormClose}
              onSuccess={refetch}
              user={user} // needed for task filtering inside the form
            />
          </div>
        </div>
      )}

      {/* Invoice List */}
      <div className="bg-white shadow rounded-lg overflow-hidden border p-4">
        {loading && (
          <p className="text-gray-500 text-center py-6">Loading invoices...</p>
        )}
        {error && (
          <p className="text-red-500 text-center py-6">{error}</p>
        )}
        {invoices && invoices.length > 0 ? (
          <InvoiceList
            invoices={invoices}
            userRole={user.role}
            onEdit={handleEditClick}
            onUpdate={refetch}
          />
        ) : (
          !loading && (
            <p className="text-gray-500 text-center py-6">No invoices found.</p>
          )
        )}
      </div>

      {/* Create Invoice Button */}
      <div className="mt-4 flex justify-end">
      </div>
    </div>
  );
};

export default InvoicesPage;