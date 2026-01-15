import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth, formatRole } from "../auth/AuthContext";
import "./layout.css";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Healthcare AB</h2>
        </div>
        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-link ${isActive("/dashboard") ? "active" : ""}`}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </Link>
          <Link
            to="/delete-account"
            className={`nav-link ${isActive("/delete-account") ? "active" : ""}`}
          >
            <span className="nav-icon">⚙️</span>
            Account Settings
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-email">{user?.email}</div>
            <div className="user-role">{user ? formatRole(user.role) : ""}</div>
          </div>
        </div>
      </aside>

      <div className="content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {location.pathname === "/dashboard" && "Dashboard"}
              {location.pathname === "/delete-account" && "Account Settings"}
            </h1>
          </div>
          <div className="topbar-right">
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}