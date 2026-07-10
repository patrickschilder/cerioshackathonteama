import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

export function NavBar() {
  const { userName, logout } = useAuth();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand">
        <div className="navbar__logo-mark">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect width="20" height="20" rx="3" fill="var(--color-accent)" />
            <text x="4" y="15" fontSize="12" fontWeight="bold" fill="var(--color-text)">C</text>
          </svg>
        </div>
        <span className="navbar__logo-text">
          Cerios <span>Academy</span>
        </span>
      </NavLink>

      <div className="navbar__spacer" />

      <ul className="navbar__nav">
        <li>
          <NavLink to="/" className={({ isActive }) => `navbar__link${isActive ? " navbar__link--active" : ""}`} end>
            Mijn cursussen
          </NavLink>
        </li>
      </ul>

      <div className="navbar__user">
        <div className="navbar__avatar">{initials || "S"}</div>
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "var(--font-size-sm)" }}>{userName}</span>
        <button
          onClick={logout}
          className="btn btn-ghost btn-sm"
          style={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.3)" }}
        >
          Uitloggen
        </button>
      </div>
    </nav>
  );
}
