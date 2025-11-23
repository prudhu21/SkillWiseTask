import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const App: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "Inter, sans-serif" }}>
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e5e5",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "blue",
        }}
      >
        <h2>
          <Link to="/" style={{ color: "white", textDecoration: "none" }}>
            Inventory Management
          </Link>
        </h2>

        <div>
          {user ? (
            <>
              <span style={{ color: "white", marginRight: 12 }}>
                Hi, <strong>{user.username}</strong>
              </span>

              <button
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
                style={{
                  background: "red",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "#029effff",
                color: "white",
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                width: '100px',
                height: '40px',
              }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default App;
