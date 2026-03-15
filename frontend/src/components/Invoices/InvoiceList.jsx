import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";
import { AuthContext } from "../../context/AuthContext";
import InvoiceForm from "./InvoiceForm";

const InvoiceList = ({ onStatsUpdate, hideTable = false }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);

  // Fetch invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let res = await API.get("/invoices");
      let data = res.data;

      // Normal users: only show own invoices
      if (user.role === "user") {
        data = data.filter((inv) => inv.createdBy?._id === user._id);
      }

      setInvoices(data);
      setFilteredInvoices(data);

      // Update stats
      if (onStatsUpdate) {
        // Count per status
        const counts = data.reduce(
          (acc, inv) => {
            const key = inv.status === "rejected" ? "rejected" : inv.status;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          },
          { draft: 0, pending: 0, approved: 0, rejected: 0, paid: 0 }
        );

        // Monthly aggregation
        const monthlyCounts = {};
        data.forEach((inv) => {
          if (!inv.createdAt) return;
          const d = new Date(inv.createdAt);
          const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        });

        const invoicesMonthly = Object.entries(monthlyCounts)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month));

        onStatsUpdate((prev) => ({ ...prev, invoices: counts, invoicesMonthly }));
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Search/filter invoices
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.description?.toLowerCase().includes(term) ||
        inv.amount.toString().includes(term) ||
        inv.status.toLowerCase().includes(term) ||
        inv.task?.title?.toLowerCase().includes(term)
    );
    setFilteredInvoices(filtered);
    setCurrentPage(1);
  }, [searchTerm, invoices]);

  const handleEdit = (invoice) => {
    if (!["admin", "operator"].includes(user.role)) return;
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!["admin", "operator"].includes(user.role)) return;
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await API.delete(`/invoices/${id}`);
      fetchInvoices();
    } catch (err) {
      console.error("Failed to delete invoice:", err);
    }
  };

  const handleStatusChange = async (invoice, newStatus) => {
    if (!["admin", "operator"].includes(user.role)) return;
    try {
      await API.put(`/invoices/${invoice._id}`, { status: newStatus });
      fetchInvoices();
    } catch (err) {
      console.error("Failed to update invoice status:", err);
    }
  };

  const handleFormClose = () => {
    setEditingInvoice(null);
    setShowForm(false);
  };

  const handleFormSuccess = () => {
    fetchInvoices();
  };

  // Pagination
  const indexOfLast = currentPage * invoicesPerPage;
  const indexOfFirst = indexOfLast - invoicesPerPage;
  const currentInvoices = filteredInvoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredInvoices.length / invoicesPerPage);

  if (hideTable) return null;

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

        <input
          type="text"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          {user.role === "user" ? "Create Invoice" : "+ Add Invoice"}
        </button>
      </div>

      {/* Invoice form modal */}
      {showForm && (
        <InvoiceForm
          invoice={editingInvoice}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Rows per page */}
      <div className="flex justify-end mb-2 items-center gap-2">
        <label>Rows per page:</label>
        <select
          value={invoicesPerPage}
          onChange={(e) => {
            setInvoicesPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border rounded px-2 py-1"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {loading ? (
        <p>Loading invoices...</p>
      ) : (
        <>
          <table className="min-w-full border bg-white rounded shadow">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-2">Invoice #</th>
                <th className="px-4 py-2">Task</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Created By</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentInvoices.map((inv) => (
                <tr key={inv._id} className="border-t">
                  <td className="px-4 py-2">{inv.invoiceNumber}</td>
                  <td className="px-4 py-2">{inv.task?.title || "-"}</td>
                  <td className="px-4 py-2">{inv.description}</td>
                  <td className="px-4 py-2">{inv.amount}</td>
                  <td className="px-4 py-2">
                    {["admin", "operator"].includes(user.role) ? (
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv, e.target.value)}
                        className="border px-2 py-1 rounded"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="paid">Paid</option>
                      </select>
                    ) : (
                      inv.status
                    )}
                  </td>
                  <td className="px-4 py-2">{inv.createdBy?.name || "-"}</td>
                  <td className="px-4 py-2 space-x-2">
                    {["admin", "operator"].includes(user.role) && (
                      <>
                        <button
                          onClick={() => handleEdit(inv)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {currentInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-4">
                    No invoices found.
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
                  onClick={() => setCurrentPage(num)}
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

export default InvoiceList;