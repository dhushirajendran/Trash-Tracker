import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";

const formatDate = (d) => { try { return new Date(d).toDateString(); } catch { return "-"; } };

const History = () => {
  const [special, setSpecial] = useState({ data: [], meta: null });
  const [recycles, setRecycles] = useState({ data: [], meta: null });
  const [pageS, setPageS] = useState(1);
  const [pageR, setPageR] = useState(1);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const load = async (ps = pageS, pr = pageR) => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        api.get(`/api/special-requests?page=${ps}&limit=5`),
        api.get(`/api/recyclables?page=${pr}&limit=5`),
      ]);
      setSpecial({ data: s.data || [], meta: s.meta });
      setRecycles({ data: r.data || [], meta: r.meta });
      setMsg("");
    } catch (e) {
      setMsg(e.message || "Failed to load history");
      setSpecial({ data: [], meta: null });
      setRecycles({ data: [], meta: null });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(1, 1); /* eslint-disable-next-line */ }, []);

  const cancelSpecial = async (id) => {
    if (!window.confirm("Cancel this special request?")) return;
    setMsg("Canceling...");
    try { await api.post(`/api/special-requests/${id}/cancel`, {}); await load(pageS, pageR); setMsg("Special request canceled."); }
    catch (e) { setMsg(e.message); }
  };

  const rescheduleSpecial = async (id) => {
    const date = window.prompt("Enter preferred date (YYYY-MM-DD):");
    if (!date) return;
    setMsg("Checking availability...");
    try {
      const avail = await api.get(`/api/special-requests/availability?date=${date}`);
      const choice = avail.data?.[0];
      if (!choice) { setMsg("No available dates found."); return; }
      await api.patch(`/api/special-requests/${id}`, { preferredDate: choice });
      await load(pageS, pageR);
      setMsg(`Rescheduled to ${choice}.`);
    } catch (e) { setMsg(e.message); }
  };

  const cancelRecycle = async (id) => {
    if (!window.confirm("Cancel this recyclable submission?")) return;
    setMsg("Canceling...");
    try { await api.patch(`/api/recyclables/${id}`, { status: "canceled" }); await load(pageS, pageR); setMsg("Submission canceled."); }
    catch (e) { setMsg(e.message); }
  };

  const completeRecycle = async (id) => {
    if (!window.confirm("Mark as completed and credit payback?")) return;
    setMsg("Completing...");
    try {
      const r = await api.postNoBody(`/api/recyclables/${id}/complete`);
      await load(pageS, pageR);
      setMsg(`${r.message} Receipt: ${r.data?.receipt?.receiptNo || "-"}`);
    } catch (e) { setMsg(e.message); }
  };

  const downloadPdf = async (id, filename = "receipt.pdf") => {
    setMsg("Preparing receipt...");
    try {
      const token = localStorage.getItem("tt_token");
      const base = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
      const res = await fetch(`${base}/api/recyclables/${id}/receipt.pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`PDF failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setMsg("Receipt downloaded.");
    } catch (e) { setMsg(e.message); }
  };

  return (
    <div className="container">
      <h1>History</h1>
      {msg && <p className="alert">{msg}</p>}
      {loading && (
        <div className="row" style={{ justifyContent: "center" }}>
          <div className="spinner" />
          <span className="muted">Loading your history…</span>
        </div>
      )}

      {/* Special Requests */}
      <h3>Special Requests</h3>
      {!loading && special.data.length === 0 ? (
        <EmptyState title="No special requests yet" hint="Create one from the Special Request page." />
      ) : (
        <>
          <ul className="list">
            {special.data.map((s) => (
              <li key={s._id} className="row">
                <div style={{ flex: 1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <strong style={{ textTransform:"capitalize" }}>{s.type}</strong>
                    <span className="badge">{s.status}</span>
                  </div>
                  <div className="muted">Preferred: {formatDate(s.preferredDate)}</div>
                  <div className="muted">Scheduled: {s.scheduledDate ? formatDate(s.scheduledDate) : "-"}</div>

                  {Array.isArray(s.alternatives) && s.alternatives.length > 0 && (
                    <div className="helper" style={{ marginTop: 6 }}>
                      Alternatives: {s.alternatives.map((d) => formatDate(d)).join(", ")}
                    </div>
                  )}

                  {s.conflictNote && <div className="error" style={{ marginTop: 6 }}>Note: {s.conflictNote}</div>}
                </div>

                {["pending", "scheduled"].includes(s.status) && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn-ghost" onClick={() => rescheduleSpecial(s._id)}>Reschedule</button>
                    <button className="btn-danger" onClick={() => cancelSpecial(s._id)}>Cancel</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="pagination">
            <span className="info">{special.meta?.page} / {special.meta?.pages || 1}</span>
            <button
              className="btn-ghost"
              disabled={!special.meta?.hasPrev}
              onClick={() => { const p = special.meta.page - 1; setPageS(p); load(p, pageR); }}
            >Prev</button>
            <button
              className="btn-primary"
              disabled={!special.meta?.hasNext}
              onClick={() => { const p = special.meta.page + 1; setPageS(p); load(p, pageR); }}
            >Next</button>
          </div>
        </>
      )}

      {/* Recyclable Submissions */}
      <h3>Recyclable Submissions</h3>
      {!loading && recycles.data.length === 0 ? (
        <EmptyState title="No recyclable submissions yet" hint="Submit recyclables to earn paybacks." />
      ) : (
        <>
          <ul className="list">
            {recycles.data.map((x) => (
              <li key={x._id} className="row">
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <strong>{x.items?.length || 0} items</strong>
                    <span className="badge">Rs. {Number(x.totalPayback || 0).toFixed(2)}</span>
                    {x.receiptNo && <span className="badge">{x.receiptNo}</span>}
                  </div>
                  <div className="muted">Status: {x.status}</div>
                </div>

                <div style={{ display:"flex", gap:8 }}>
                  {["submitted", "processing"].includes(x.status) && (
                    <>
                      <button className="btn-ghost" onClick={() => cancelRecycle(x._id)}>Cancel</button>
                      <button className="btn-primary" onClick={() => completeRecycle(x._id)}>Complete</button>
                    </>
                  )}
                  {x.status === "completed" && (
                    <button className="btn-primary" onClick={() => downloadPdf(x._id, (x.receiptNo || "receipt") + ".pdf")}>
                      Download PDF
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="pagination">
            <span className="info">{recycles.meta?.page} / {recycles.meta?.pages || 1}</span>
            <button
              className="btn-ghost"
              disabled={!recycles.meta?.hasPrev}
              onClick={() => { const p = recycles.meta.page - 1; setPageR(p); load(pageS, p); }}
            >Prev</button>
            <button
              className="btn-primary"
              disabled={!recycles.meta?.hasNext}
              onClick={() => { const p = recycles.meta.page + 1; setPageR(p); load(pageS, p); }}
            >Next</button>
          </div>
        </>
      )}
    </div>
  );
};
export default History;
