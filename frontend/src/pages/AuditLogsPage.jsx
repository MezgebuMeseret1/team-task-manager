import React, { useEffect, useState } from "react";
import API from "../api/api";
import MainLayout from "../components/Layout/MainLayout";

const actionColors = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-purple-100 text-purple-700",
  LOGOUT: "bg-purple-200 text-purple-800",
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = 20; // logs per page

  const fetchLogs = async (pageNum = page, searchTerm = search) => {
    setLoading(true);
    try {
      const res = await API.get("/audit", {
        params: { page: pageNum, limit, search: searchTerm },
      });
      setLogs(res.data.logs || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || pageNum);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  fetchLogs();
}, [page, search]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearch(term);
    setPage(1);
    fetchLogs(1, term); // fetch first page of new search
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchLogs(newPage, search);
  };

  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Audit Logs</h2>
          <input
            type="text"
            placeholder="Search logs..."
            className="border px-3 py-2 rounded-md"
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                <th className="p-3 text-left">User</th>
                <th className="p-3 text-left">Action</th>
                <th className="p-3 text-left">Resource</th>
                <th className="p-3 text-left">IP</th>
                <th className="p-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{log.user?.name || "System"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          actionColors[log.action?.split("_")[0]] ||
                          "bg-gray-100"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3">{log.entity}</td>
                    <td className="p-3">{log.ipAddress || "N/A"}</td>
                    <td className="p-3">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center space-x-2">
            <button
              className="px-3 py-1 rounded border"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Prev
            </button>
            <span className="px-3 py-1 rounded border bg-gray-100">
              Page {page} / {totalPages}
            </span>
            <button
              className="px-3 py-1 rounded border"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AuditLogsPage;