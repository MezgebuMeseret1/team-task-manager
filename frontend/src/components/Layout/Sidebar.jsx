import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  Building2,
  ClipboardList,
  FileText,
  ShieldCheck,
} from "lucide-react";
const Sidebar = ({ collapsed = false }) => {
  const { user } = useContext(AuthContext);

  const baseLink =
    "flex items-center gap-3 px-3 py-2 rounded-md transition hover:bg-gray-700";

  const activeLink = "bg-gray-700";

  return (
    <aside className="h-full flex flex-col text-gray-200">
      {/* Header */}
      <div className="flex items-center justify-center py-4 border-b border-gray-700">
        {!collapsed && (
          <span className="text-lg font-semibold tracking-wide">
            Admin Panel
          </span>
        )}
      </div>

      {/* Navigation */}
      <ul className="flex-1 flex flex-col space-y-2 mt-4 px-2">

        {/* Dashboard */}
        <li>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : ""}`
            }
          >
            <LayoutDashboard size={18} />
            {!collapsed && <span>Dashboard</span>}
          </NavLink>
        </li>

        {/* Admin Only */}
        {user?.role === "admin" && (
          <li>
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `${baseLink} ${isActive ? activeLink : ""}`
              }
            >
              <Users size={18} />
              {!collapsed && <span>Users</span>}
            </NavLink>
          </li>
        )}
        {/* Audit Logs - Admin Only */}
{user?.role === "admin" && (
  <li>
    <NavLink
      to="/audit"
      className={({ isActive }) =>
        `${baseLink} ${isActive ? activeLink : ""}`
      }
    >
      <ShieldCheck size={18} />
      {!collapsed && <span>Audit Logs</span>}
    </NavLink>
  </li>
)}

        {/* Admin + Operator */}
        {["admin", "operator"].includes(user?.role) && (
          <li>
            <NavLink
              to="/workspaces"
              className={({ isActive }) =>
                `${baseLink} ${isActive ? activeLink : ""}`
              }
            >
              <Building2 size={18} />
              {!collapsed && <span>Workspaces</span>}
            </NavLink>
          </li>
        )}

        {/* Tasks (ALL USERS) */}
        <li>
          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : ""}`
            }
          >
            <ClipboardList size={18} />
            {!collapsed && <span>Tasks</span>}
          </NavLink>
        </li>

        {/* Invoices (ALL USERS) */}
        <li>
          <NavLink
            to="/invoices"
            className={({ isActive }) =>
              `${baseLink} ${isActive ? activeLink : ""}`
            }
          >
            <FileText size={18} />
            {!collapsed && <span>Invoices</span>}
          </NavLink>
        </li>
      </ul>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 text-xs text-gray-400 border-t border-gray-700">
          © {new Date().getFullYear()} SaaS Admin
        </div>
      )}
    </aside>
  );
};

export default Sidebar;