import { useState, useEffect } from "react";
import Board from "./components/Board";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./index.css";

/*
  ROUTING LOGIC (no react-router needed — tiny SPA)
  - "board"     → public notice board (default)
  - "login"     → admin login page
  - "dashboard" → admin dashboard (protected)
*/

export default function App() {
  const [page, setPage] = useState("board");
  const [user, setUser] = useState(null); // { username, role }

  // On mount, restore session from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("nb_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // If they were on dashboard stay there
        const savedPage = sessionStorage.getItem("nb_page");
        if (savedPage === "dashboard") setPage("dashboard");
      } catch (_) {
        sessionStorage.clear();
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    sessionStorage.setItem("nb_user", JSON.stringify(userData));
    sessionStorage.setItem("nb_page", "dashboard");
    setPage("dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/logout", { method: "GET", credentials: "include" });
    } catch (_) {}
    setUser(null);
    sessionStorage.clear();
    setPage("board");
  };

  const navigate = (target) => {
    sessionStorage.setItem("nb_page", target);
    setPage(target);
  };

  return (
    <div className="app-root">
      {page === "board" && (
        <Board onAdminClick={() => navigate("login")} />
      )}
      {page === "login" && (
        <Login
          onSuccess={handleLoginSuccess}
          onBack={() => navigate("board")}
        />
      )}
      {page === "dashboard" && user && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onViewBoard={() => navigate("board")}
        />
      )}
      {/* Redirect to login if dashboard accessed without user */}
      {page === "dashboard" && !user && (
        <Login
          onSuccess={handleLoginSuccess}
          onBack={() => navigate("board")}
        />
      )}
    </div>
  );
}