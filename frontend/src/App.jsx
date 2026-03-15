import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import { NotificationProvider } from "./context/NotificationContext";
import Dashboard from "./pages/Dashboard";
import UsersPage from "./pages/UsersPage";
import WorkspacesPage from "./pages/WorkspacesPage";
import TasksPage from "./pages/TasksPage";
import InvoicesPage from "./pages/InvoicesPage";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./routes/ProtectedRoute";
import AuditLogsPage from "./pages/AuditLogsPage";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* ---------------- Public Routes ---------------- */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* ---------------- Redirect root to /dashboard ---------------- */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* ---------------- Protected Routes ---------------- */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/workspaces"
              element={
                <ProtectedRoute roles={["admin", "operator"]}>
                  <WorkspacesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/tasks"
              element={
                <ProtectedRoute roles={["admin", "operator", "user"]}>
                  <TasksPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoices"
              element={
                <ProtectedRoute roles={["admin", "operator", "user"]}>
                  <InvoicesPage />
                </ProtectedRoute>
              }
            />
            <Route
  path="/audit"
  element={
    <ProtectedRoute roles={["admin"]}>
      <AuditLogsPage />
    </ProtectedRoute>
  }
/>

            {/* ---------------- 404 Fallback ---------------- */}
            <Route path="*" element={<h1>404 - Page Not Found</h1>} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;