import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const nav = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("resident"); // choose 'admin' only for testing
  const [adminCode, setAdminCode] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setMsg("Registering…");
    try {
      await register(name, email, password, role, adminCode);
      nav("/");
    } catch (e) {
      setMsg(e.message);
    }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={submit} style={{ maxWidth: 480 }}>
        <label>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} required />
        <label>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        <label>Role (demo)</label>
        <select value={role} onChange={e=>setRole(e.target.value)}>
          <option value="resident">Resident</option>
          <option value="admin">Admin</option>
        </select>

        {role === "admin" && (
          <>
            <label>Admin Invite Code</label>
            <input value={adminCode} onChange={e=>setAdminCode(e.target.value)} placeholder="ADMIN123" />
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <button type="submit">Create account</button>
        </div>
        <p style={{ color: "var(--muted)" }}>{msg}</p>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
};

export default Register;
