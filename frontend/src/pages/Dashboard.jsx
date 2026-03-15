import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api/api";
import TaskList from "../components/Tasks/TaskList";
import InvoiceList from "../components/Invoices/InvoiceList";
import MainLayout from "../components/Layout/MainLayout";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const statusColors = {
  todo: "bg-gray-300",
  "in progress": "bg-blue-400",
  completed: "bg-green-400",
  rejected: "bg-red-400",
  draft: "bg-gray-300",
  pending: "bg-yellow-400",
  approved: "bg-green-400",
  rejectedInvoice: "bg-red-400",
  paid: "bg-purple-400",
};

const DashboardPage = () => {
  const { user, logout } = useContext(AuthContext);

  const [stats, setStats] = useState({
    tasks: {},
    invoices: {},
    totalUsers: 0,
    totalWorkspaces: 0,
    revenue: 0,
    pendingApprovals: 0,
    overdueTasks: 0,
    tasksMonthly: [],
    invoicesMonthly: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard stats only after user is loaded
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await API.get("/dashboard/stats");
        setStats(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to fetch dashboard stats"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (!user || loading)
    return (
      <MainLayout>
        <p className="p-6 text-center text-gray-600">Loading dashboard...</p>
      </MainLayout>
    );

  if (error)
    return (
      <MainLayout>
        <p className="p-6 text-center text-red-500">{error}</p>
      </MainLayout>
    );

  // ---------------- USER DASHBOARD ----------------
  if (user.role.toLowerCase() === "user") {
    return (
      <MainLayout>
        <div className="p-10 max-w-7xl mx-auto space-y-10">
          <h2 className="text-2xl font-semibold">Welcome, {user.name}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks Overview */}
            <div className="p-6 bg-yellow-50 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Tasks Overview</h3>
              {["todo", "in progress", "completed", "rejected"].map(
                (status) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status}</span>
                    <span>{stats.tasks?.[status] || 0}</span>
                  </div>
                )
              )}
              <Link
                to="/tasks"
                className="text-yellow-600 mt-3 inline-block hover:underline"
              >
                View All Tasks
              </Link>
            </div>

            {/* Invoices Overview */}
            <div className="p-6 bg-purple-50 rounded-xl shadow">
              <h3 className="font-semibold mb-2">Invoices Overview</h3>
              {["draft", "pending", "approved", "rejected", "paid"].map(
                (status) => (
                  <div key={status} className="flex justify-between">
                    <span className="capitalize">{status}</span>
                    <span>{stats.invoices?.[status] || 0}</span>
                  </div>
                )
              )}
              <Link
                to="/invoices"
                className="text-purple-600 mt-3 inline-block hover:underline"
              >
                View All Invoices
              </Link>
            </div>
          </div>

          {/* Hidden components for stats refresh */}
          <TaskList onStatsUpdate={setStats} hideTable />
          <InvoiceList onStatsUpdate={setStats} hideTable />
        </div>
      </MainLayout>
    );
  }

  // ---------------- ADMIN DASHBOARD ----------------
  return (
    <MainLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {stats.overdueTasks > 0 && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
            ⚠️ {stats.overdueTasks} tasks are overdue
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <div className="p-6 bg-white rounded-xl shadow">
            <h3>Total Users</h3>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow">
            <h3>Workspaces</h3>
            <p className="text-3xl font-bold">{stats.totalWorkspaces}</p>
          </div>
          <div className="p-6 bg-green-50 rounded-xl shadow">
            <h3>Revenue</h3>
            <p className="text-3xl font-bold text-green-600">
              ${stats.revenue || 0}
            </p>
          </div>
          <div className="p-6 bg-yellow-50 rounded-xl shadow">
            <h3>Pending Approvals</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.pendingApprovals || 0}
            </p>
          </div>
        </div>

        {/* Task & Invoice Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Status */}
          <div className="p-6 bg-gray-900 text-white rounded-xl">
            <h3 className="mb-4 font-semibold">Task Status</h3>
            {["todo", "in progress", "completed", "rejected"].map(
              (status) => (
                <div
                  key={status}
                  className={`flex justify-between px-4 py-2 rounded-full mb-1 ${
                    statusColors[status]
                  }`}
                >
                  <span className="capitalize">{status}</span>
                  <span>{stats.tasks?.[status] || 0}</span>
                </div>
              )
            )}
          </div>

          {/* Invoice Status */}
          <div className="p-6 bg-purple-900 text-white rounded-xl">
            <h3 className="mb-4 font-semibold">Invoice Status</h3>
            {["draft", "pending", "approved", "rejected", "paid"].map(
              (status) => (
                <div
                  key={status}
                  className={`flex justify-between px-4 py-2 rounded-full mb-1 ${
                    status === "rejected"
                      ? statusColors.rejectedInvoice
                      : statusColors[status]
                  }`}
                >
                  <span className="capitalize">{status}</span>
                  <span>{stats.invoices?.[status] || 0}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="mb-4 font-semibold">Tasks Per Month</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.tasksMonthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3 className="mb-4 font-semibold">Invoices Per Month</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.invoicesMonthly}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#9333ea" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hidden components for stats refresh */}
        <TaskList onStatsUpdate={setStats} hideTable />
        <InvoiceList onStatsUpdate={setStats} hideTable />
      </div>
    </MainLayout>
  );
};

export default DashboardPage;