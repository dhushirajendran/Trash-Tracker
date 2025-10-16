import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

const AdminReports = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const r = await api.get(`/api/admin/reports/paybacks?${qs.toString()}`);
      setData(r.data);
      setMsg("");
    } catch (e) { setMsg(e.message); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <>
      <h1>Payback Reports</h1>
      {msg && <p style={{ color: "var(--muted)" }}>{msg}</p>}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} placeholder="From" />
        <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} placeholder="To" />
        <button onClick={load}>Run</button>
      </div>

      {!data ? <p>No data</p> : (
        <>
          <div className="card" style={{ padding: 16, marginBottom: 12 }}>
            <h3>Totals</h3>
            <p><strong>Credited:</strong> Rs. {Number(data.totals?.credited || 0).toFixed(2)} ({data.totals?.creditedCount || 0} txns)</p>
            <p><strong>Failed:</strong> Rs. {Number(data.totals?.failed || 0).toFixed(2)} ({data.totals?.failedCount || 0} txns)</p>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <h3>Latest 100 Paybacks</h3>
            {Array.isArray(data.latest) && data.latest.length > 0 ? (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {data.latest.map((p) => (
                  <li key={p._id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "6px 0", borderBottom: "1px solid #eee" }}>
                    <span>{new Date(p.createdAt).toLocaleString()}</span>
                    <span>{p.status}</span>
                    <span>Rs. {Number(p.amount || 0).toFixed(2)}</span>
                    <span>{p.submission?.receiptNo || "-"}</span>
                  </li>
                ))}
              </ul>
            ) : <p>No paybacks in range.</p>}
          </div>
        </>
      )}
    </>
  );
};

export default AdminReports;
