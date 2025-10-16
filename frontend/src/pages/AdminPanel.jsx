import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const todayISO = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => (d ? new Date(d).toLocaleString() : "-");

const AdminPanel = () => {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [capacity, setCapacity] = useState(null);
  const [pending, setPending] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [cap, pend] = await Promise.all([
        api.get(`/api/admin/capacity?date=${todayISO()}`),
        api.get(`/api/admin/special-requests?status=pending&page=1&limit=6`),
      ]);
      setCapacity(cap.data);
      setPending(pend.data || []);
      setMsg("");
    } catch (e) {
      setMsg(e.message || "Failed to load admin overview");
      setCapacity(null);
      setPending([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container">
      {/* Hero / heading */}
      <div className="card" style={{
        padding: 24,
        background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0 }}>Admin Console</h1>
            <div className="muted" style={{ marginTop: 6 }}>
              Overview for <strong>{todayISO()}</strong>. Manage queue, capacity, and payback reports.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/admin/queue" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 12 }}>
              Open Queue
            </Link>
            <Link to="/admin/capacity" className="btn-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 12 }}>
              Capacity
            </Link>
            <Link to="/admin/reports" className="btn-ghost" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 12 }}>
              Reports
            </Link>
          </div>
        </div>
      </div>

      {msg && <p className="alert" style={{ marginTop: 12 }}>{msg}</p>}
      {loading && (
        <div className="row" style={{ marginTop: 12, justifyContent: "center" }}>
          <div className="spinner" /><span className="muted">Loading admin data…</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid-3" style={{ marginTop: 16 }}>
        <StatCard
          label="Today's Capacity"
          value={capacity ? `${capacity.remaining}/${capacity.maxPerDay}` : "-"}
          hint={capacity ? `${capacity.scheduledCount} scheduled/pending today` : "—"}
          tone={capacity && capacity.remaining > 0 ? "success" : "warning"}
        />
        <StatCard
          label="Pending Requests"
          value={pending.length}
          hint="Top 6 shown below"
          tone={pending.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Quick Actions"
          value="Queue / Capacity / Reports"
          hint="Jump to admin tools via the buttons above"
        />
      </div>

      {/* Pending queue preview */}
      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Pending Queue (preview)</h2>
          <Link to="/admin/queue" className="btn-primary" style={{ textDecoration: "none" }}>Manage Queue</Link>
        </div>

        {pending.length === 0 ? (
          <EmptyState title="All clear" hint="No pending special requests right now." />
        ) : (
          <ul className="list" style={{ marginTop: 12 }}>
            {pending.map((r) => (
              <li key={r._id} className="row">
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong style={{ textTransform: "capitalize" }}>{r.type}</strong>
                    <span className="badge">{r.status}</span>
                  </div>
                  <div className="muted">
                    Resident: {r.resident?.name} ({r.resident?.email}) · Preferred: {fmt(r.preferredDate)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to="/admin/queue" className="btn-ghost" style={{ textDecoration: "none" }}>
                    Schedule
                  </Link>
                  <Link to="/admin/reports" className="btn-ghost" style={{ textDecoration: "none" }}>
                    View Reports
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tips */}
      <div className="grid-3" style={{ marginTop: 16 }}>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Tip: Avoid Overbooking</h3>
          <p className="muted" style={{ margin: 0 }}>
            Check <strong>Capacity</strong> before scheduling. When the remaining slots reach 0, consider proposing alternative dates.
          </p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Tip: Paybacks</h3>
          <p className="muted" style={{ margin: 0 }}>
            Completed recyclables auto-generate paybacks. Use <strong>Reports</strong> to review credited vs. failed transactions.
          </p>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Tip: Communication</h3>
          <p className="muted" style={{ margin: 0 }}>
            If a date is full, reschedule and add a short note in the request. Residents will see the update in their History.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
