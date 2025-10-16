import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const r = await api.get("/api/notifications");
      setItems(r.data || []);
    } catch { setItems([]); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`, {});
      setMsg("Marked as read");
      await load();
    } catch (e) { setMsg(e.message); }
  };

  return (
    <>
      <h1>Notifications</h1>
      <p style={{ color: "var(--muted)" }}>{msg}</p>
      {items.length === 0 ? <p>No notifications yet.</p> : (
        <ul>
          {items.map(n => (
            <li key={n._id} className="card" style={{ padding: 12, marginBottom: 8, opacity: n.isRead ? 0.6 : 1 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: n.type === "error" ? "var(--danger)" : n.type === "success" ? "var(--success)" : n.type === "warning" ? "var(--warning)" : "var(--muted)" }} />
                <div style={{ flex: 1 }}>
                  <strong>{n.title}</strong>
                  <div style={{ color: "var(--muted)" }}>{n.message}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                {!n.isRead && <button onClick={() => markRead(n._id)}>Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Notifications;
