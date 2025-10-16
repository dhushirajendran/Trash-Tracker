import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

const AdminCapacity = () => {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [cap, setCap] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async (d = date) => {
    try {
      const r = await api.get(`/api/admin/capacity?date=${d}`);
      setCap(r.data);
      setMsg("");
    } catch (e) { setMsg(e.message); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <>
      <h1>Capacity & Conflicts</h1>
      {msg && <p style={{ color: "var(--muted)" }}>{msg}</p>}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
        <button onClick={() => load(date)}>Check</button>
      </div>

      {cap ? (
        <div className="card" style={{ padding: 16 }}>
          <p><strong>Date:</strong> {cap.date}</p>
          <p><strong>Scheduled (pending+scheduled):</strong> {cap.scheduledCount}</p>
          <p><strong>Max per day:</strong> {cap.maxPerDay}</p>
          <p><strong>Remaining:</strong> {cap.remaining}</p>
          <p style={{ color: cap.remaining > 0 ? "var(--success)" : "var(--danger)" }}>
            {cap.remaining > 0 ? "Slots available" : "Full capacity"}
          </p>
        </div>
      ) : <p>No data</p>}
    </>
  );
};

export default AdminCapacity;
