import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const links = [
  { to: "/", label: "Dashboard", icon: "▦" },
  { to: "/transactions", label: "Transactions", icon: "⇄" },
  { to: "/savings", label: "Savings", icon: "🐖" },
  { to: "/about", label: "About", icon: "ℹ" },
  { to: "/contact", label: "Contact", icon: "✉" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col p-4">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">£</div>
          <span className="text-base font-semibold text-gray-800">Spendly</span>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 font-medium"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                }`
              }
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-100 pt-4 mt-4">
          <p className="text-xs text-gray-400 px-3 mb-2">{user?.name}</p>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors w-full text-left"
          >
            <span>→</span>
            Log out
          </button>
        </div>
      </div>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div style={{ backgroundColor: "rgba(0,0,0,0.35)" }} className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-xs mx-4 text-center">
            <p className="text-lg font-semibold text-gray-800 mb-2">Log out?</p>
            <p className="text-sm text-gray-400 mb-6">Are you sure you want to sign out of Spendly?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}