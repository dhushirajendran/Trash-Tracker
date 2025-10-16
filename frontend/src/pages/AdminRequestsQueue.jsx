import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";

const fmt = (d) => (d ? new Date(d).toDateString() : "-");

const AdminRequestsQueue = () => {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ status: "", type: "", q: "" });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async (p = page) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filters.status) qs.set("status", filters.status);
    if (filters.type) qs.set("type", filters.type);
    if (filters.q) qs.set("q", filters.q);
    qs.set("page", String(p));
    qs.set("limit", "10");
    try {
      const r = await api.get(`/api/admin/special-requests?${qs.toString()}`);
      setRows(r.data || []);
      setMeta(r.meta || null);
      setMsg("");
    } catch (e) { setMsg(e.message); setRows([]); setMeta(null); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  const search = async (e) => { e.preventDefault(); await load(1); setPage(1); };

  const schedule = async (id) => {
    const date = window.prompt("Schedule to date (YYYY-MM-DD):");
    if (!date) return;
    setMsg("Scheduling...");
    try { await api.patch(`/api/admin/special-requests/${id}/schedule`, { scheduledDate: date }); await load(page); setMsg("Scheduled."); }
    catch (e) { setMsg(e.message); }
  };

  const setStatus = async (id, status) => {
    if (!window.confirm(`Set status to ${status}?`)) return;
    setMsg("Updating...");
    try { await api.patch(`/api/admin/special-requests/${id}/status`, { status }); await load(page); setMsg("Updated."); }
    catch (e) { setMsg(e.message); }
  };

  return (
    <div className="container">
      <h1>Requests Queue</h1>
      {msg && <p className="alert">{msg}</p>}

      <form onSubmit={search} className="row" style={{ marginBottom: 12 }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", width:"100%" }}>
          <select value={filters.status} onChange={(e)=>setFilters({ ...filters, status: e.target.value })}>
            <option value="">Any status</option>
            <option>pending</option><option>scheduled</option><option>completed</option><option>canceled</option>
          </select>
          <select value={filters.type} onChange={(e)=>setFilters({ ...filters, type: e.target.value })}>
            <option value="">Any type</option>
            <option>bulky</option><option>ewaste</option>
          </select>
          <input placeholder="Resident email contains…" value={filters.q}
                 onChange={(e)=>setFilters({ ...filters, q: e.target.value })} />
          <button type="submit" className="btn-primary">Filter</button>
        </div>
      </form>

      {loading && (
        <div className="row" style={{ justifyContent: "center" }}>
          <div className="spinner" />
          <span className="muted">Loading…</span>
        </div>
      )}

      {!loading && rows.length === 0 ? (
        <EmptyState title="No requests" hint="Try changing your filters." />
      ) : (
        <>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Type</th>
                  <th>Preferred</th>
                  <th>Scheduled</th>
                  <th>Status</th>
                  <th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r._id}>
                    <td>{r.resident?.name} <span className="muted">({r.resident?.email})</span></td>
                    <td style={{ textTransform:"capitalize" }}>{r.type}</td>
                    <td>{fmt(r.preferredDate)}</td>
                    <td>{fmt(r.scheduledDate)}</td>
                    <td><span className="badge">{r.status}</span></td>
                    <td style={{ textAlign:"right" }}>
                      <div style={{ display:"inline-flex", gap:6 }}>
                        <button className="btn-ghost" onClick={() => schedule(r._id)}>Schedule</button>
                        {r.status !== "completed" && <button className="btn-primary" onClick={() => setStatus(r._id, "completed")}>Complete</button>}
                        {r.status !== "canceled" && <button className="btn-danger" onClick={() => setStatus(r._id, "canceled")}>Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <span className="info">{meta?.page} / {meta?.pages || 1}</span>
            <button className="btn-ghost" disabled={!meta?.hasPrev} onClick={() => { const p = meta.page - 1; setPage(p); load(p); }}>Prev</button>
            <button className="btn-primary" disabled={!meta?.hasNext} onClick={() => { const p = meta.page + 1; setPage(p); load(p); }}>Next</button>
          </div>
        </>
      )}
    </div>
  );
};
export default AdminRequestsQueue;
