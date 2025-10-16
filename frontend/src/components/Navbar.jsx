import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth() || {};

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">
            <span className="brand-dot" />
            <span>TrashTrack</span>
            {user?.role && <span className="badge">{user.role}</span>}
          </div>
        </Link>

        <nav className="nav">
          {user ? (
            <>
              <NavLink to="/" end>Dashboard</NavLink>
              <NavLink to="/special">Special</NavLink>
              <NavLink to="/recycle">Recyclables</NavLink>
              <NavLink to="/history">History</NavLink>
              <NavLink to="/rewards">Rewards</NavLink>
              <NavLink to="/notifications">Notifications</NavLink>
              {user.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
              <button className="btn-ghost" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
