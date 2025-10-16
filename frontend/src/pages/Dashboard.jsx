import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const fmtDate = (d) => { try { return new Date(d).toLocaleString(); } catch { return "-"; } };
const todayISO = () => new Date().toISOString().slice(0,10);

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [health, setHealth] = useState(null);

  // Resident data
  const [special, setSpecial] = useState({ items: [], meta: null });
  const [recycles, setRecycles] = useState({ items: [], meta: null });

  // Admin data
  const [capacity, setCapacity] = useState(null);
  const [adminPending, setAdminPending] = useState([]);

  // Live clock / refresh timer
  const [now, setNow] = useState(new Date());
  const [nextRefreshIn, setNextRefreshIn] = useState(30);
  const timerRef = useRef(null);

  const load = async () => {
    try {
      // health + two lists for residents
      const [h, s, r] = await Promise.all([
        api.get("/api/health"),
        api.get("/api/special-requests?page=1&limit=5"),
        api.get("/api/recyclables?page=1&limit=5"),
      ]);

      setHealth(h);
      setSpecial({ items: s.data || [], meta: s.meta || null });
      setRecycles({ items: r.data || [], meta: r.meta || null });

      // admin extras
      if (isAdmin) {
        const [cap, pend] = await Promise.all([
          api.get(`/api/admin/capacity?date=${todayISO()}`),
          api.get("/api/admin/special-requests?status=pending&page=1&limit=5")
        ]);
        setCapacity(cap.data);
        setAdminPending(pend.data || []);
      }

      setMsg("");
    } catch (e) {
      setMsg(e.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  // initial + live refresh every 30s
  useEffect(() => {
    load();
    timerRef.current = setInterval(() => {
      setNow(new Date());
      setNextRefreshIn((s) => {
        if (s <= 1) { load(); return 30; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  // Derive quick stats for resident
  const residentStats = useMemo(() => {
    const totalSpec = special.meta?.total ?? special.items.length;
    const totalRec = recycles.meta?.total ?? recycles.items.length;
    const upcoming = special.items.filter(i => ["pending","scheduled"].includes(i.status)).length;
    const completedToday = recycles.items.filter(x => x.status === "completed").length;
    return { totalSpec, totalRec, upcoming, completedToday };
  }, [special, recycles]);

  return (
    <div className="container">
      <div style={{ display:"flex", alignItems:"baseline", gap:12 }}>
        <h1>Dashboard</h1>
        <span className="muted">Live · {now.toLocaleTimeString()} · refresh in {nextRefreshIn}s</span>
      </div>

      {msg && <p className="alert">{msg}</p>}
      {loading && (
        <div className="row" style={{ justifyContent:"center" }}>
          <div className="spinner" /><span className="muted">Loading dashboard…</span>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid-3" style={{ marginTop: 12 }}>
        <StatCard
          label="Trash Track Health"
          value={health?.status || "unknown"}
          hint={health?.uptime ? `Uptime: ${Math.floor(Number(health.uptime))}s` : undefined}
        />
        <StatCard
          label="Your Special Requests"
          value={residentStats.totalSpec}
          hint={`${residentStats.upcoming} upcoming`}
        />
        <StatCard
          label="Your Recyclables"
          value={residentStats.totalRec}
          hint={`${residentStats.completedToday} completed (recent)`}
          tone="success"
        />
      </div>

      {/* Two columns: Upcoming specials + recent recyclables */}
      <div className="grid-2" style={{ marginTop: 16 }}>
        {/* Upcoming specials */}
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Upcoming Special Pickups</h2>
          {special.items.length === 0 ? (
            <EmptyState title="No special requests" hint="Create one from the Special page." />
          ) : (
            <ul className="list">
              {special.items.slice(0,5).map(s => (
                <li key={s._id} className="row">
                  <div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <strong style={{ textTransform:"capitalize" }}>{s.type}</strong>
                      <span className="badge">{s.status}</span>
                    </div>
                    <div className="muted">
                      Preferred: {fmtDate(s.preferredDate)} · Scheduled: {s.scheduledDate ? fmtDate(s.scheduledDate) : "-"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent recyclables */}
        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ marginTop: 0 }}>Recent Recyclables</h2>
          {recycles.items.length === 0 ? (
            <EmptyState title="No recyclables yet" hint="Submit recyclables to earn paybacks." />
          ) : (
            <ul className="list">
              {recycles.items.slice(0,5).map(x => (
                <li key={x._id} className="row">
                  <div>
                    <strong>{x.items?.length || 0} items</strong>{" "}
                    <span className="badge">Rs. {Number(x.totalPayback || 0).toFixed(2)}</span>
                    <div className="muted">Status: {x.status}{x.receiptNo ? ` · ${x.receiptNo}` : ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Admin area */}
      {isAdmin && (
        <>
          <h2 style={{ marginTop: 22 }}>Admin — Today</h2>
          <div className="grid-3">
            <StatCard
              label={`Capacity (${todayISO()})`}
              value={capacity ? `${capacity.remaining}/${capacity.maxPerDay}` : "-"}
              hint={capacity ? `${capacity.scheduledCount} scheduled/pending` : "Loading…"}
              tone={capacity && capacity.remaining > 0 ? "success" : "warning"}
            />
            <StatCard
              label="Pending Requests"
              value={adminPending.length}
              hint="Top 5 in queue"
              tone={adminPending.length > 0 ? "warning" : "success"}
            />
            <StatCard
              label="Environment"
              value={process.env.NODE_ENV || "development"}
              hint="Admin quick glance"
            />
          </div>

          <div className="card" style={{ padding: 16, marginTop: 16 }}>
            <h3 style={{ marginTop: 0 }}>Pending Queue (preview)</h3>
            {adminPending.length === 0 ? (
              <EmptyState title="All clear" hint="No pending special requests right now." />
            ) : (
              <ul className="list">
                {adminPending.map(r => (
                  <li key={r._id} className="row">
                    <div>
                      <strong style={{ textTransform: "capitalize" }}>{r.type}</strong>{" "}
                      <span className="badge">{r.status}</span>
                      <div className="muted">
                        Resident: {r.resident?.name} ({r.resident?.email}) · Preferred {fmtDate(r.preferredDate)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
