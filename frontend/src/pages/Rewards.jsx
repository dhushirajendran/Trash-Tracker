import React, { useEffect, useMemo, useState } from "react";
import { api } from "../utils/api";

/** Reliable images (Picsum) + clear, consistent aspect ratios */
const CATALOG = [
  {
    id: "gift-100",
    name: "Rs. 100 TrashTrack Gift Voucher",
    cost: 100,
    img: "https://picsum.photos/id/1050/1200/800", // voucher-like abstract
    desc: "Use on your next bill with partner vendors."
  },
  {
    id: "bag-eco",
    name: "Eco Reusable Bag",
    cost: 180,
    img: "https://picsum.photos/id/1060/1200/800", // product still-life
    desc: "Sturdy cotton tote. Reduce plastic use."
  },
  {
    id: "metro-ride",
    name: "Free Metro Ride",
    cost: 240,
    img: "https://picsum.photos/id/1011/1200/800",
    desc: "One zone, single trip with city transport."
  },
  {
    id: "tree-plant",
    name: "Plant a Tree (NGO Donation)",
    cost: 300,
    img: "https://picsum.photos/id/1020/1200/800",
    desc: "We’ll fund one sapling in your name."
  },
  {
    id: "recycle-kit",
    name: "Home Recycling Starter Kit",
    cost: 420,
    img: "https://picsum.photos/id/1044/1200/800",
    desc: "Labels + bins to organize at home."
  },
];

/** Small card for a reward item with image fallback */
const RewardCard = ({ item, canRedeem, onRedeem }) => {
  const [src, setSrc] = useState(item.img);
  const fallback =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='800'>
        <rect width='100%' height='100%' fill='#eef6ff'/>
        <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
              fill='#0b2540' font-size='28' font-family='Inter, sans-serif'>
          Image unavailable
        </text>
      </svg>`
    );

  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ height: 160, position: "relative", overflow: "hidden" }}>
        <img
          src={src}
          alt={item.name}
          onError={() => setSrc(fallback)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div
          className="badge"
          style={{
            position: "absolute",
            right: 10,
            top: 10,
            background: "#ffffff",
            borderColor: "#dde6ee",
          }}
        >
          {item.cost} pts
        </div>
      </div>
      <div style={{ padding: 14 }}>
        <strong>{item.name}</strong>
        <div className="muted" style={{ marginTop: 6 }}>{item.desc}</div>
        <div style={{ marginTop: 12 }}>
          <button
            className="btn-primary"
            disabled={!canRedeem(item)}
            onClick={() => onRedeem(item)}
          >
            {canRedeem(item) ? "Redeem" : "Need more points"}
          </button>
        </div>
      </div>
    </div>
  );
};

const Rewards = () => {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [recycles, setRecycles] = useState([]);
  const [redemptions, setRedemptions] = useState([]);

  // Load recent recyclables to compute available points
  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/recyclables?page=1&limit=50");
      setRecycles(r.data || []);
      setMsg("");
    } catch (e) {
      setMsg(e.message || "Failed to load rewards data");
      setRecycles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // 1 point = Rs. 1 from completed recyclables (demo logic)
  const availablePoints = useMemo(() => {
    return recycles
      .filter(x => x.status === "completed")
      .reduce((sum, x) => sum + Number(x.totalPayback || 0), 0);
  }, [recycles]);

  const usedPoints = useMemo(
    () => redemptions.reduce((s, r) => s + r.cost, 0),
    [redemptions]
  );

  const remainingPoints = Math.max(0, Math.floor(availablePoints - usedPoints));
  const canRedeem = (item) => remainingPoints >= item.cost;

  const redeem = (item) => {
    if (!canRedeem(item)) { setMsg("Not enough points."); return; }
    // Demo-only: generate a local code
    const code = `${item.id.toUpperCase()}-${Math.floor(Math.random()*100000).toString().padStart(5,"0")}`;
    const redemption = { ...item, code, ts: new Date().toISOString() };
    setRedemptions([redemption, ...redemptions]);
    setMsg(`Redeemed: ${item.name} (code: ${code})`);
  };

  return (
    <div className="container">
      <h1>Rewards</h1>
      {msg && <p className="alert">{msg}</p>}

      {/* Points overview */}
      <div className="grid-3">
        <div className="card" style={{ padding: 16 }}>
          <div className="muted" style={{ fontSize: 12 }}>Total Earned (completed recyclables)</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
            {Math.floor(availablePoints)} pts
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="muted" style={{ fontSize: 12 }}>Redeemed</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
            {usedPoints} pts
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="muted" style={{ fontSize: 12 }}>Available</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginTop: 6 }}>
            {remainingPoints} pts
          </div>
        </div>
      </div>

      {/* Catalog */}
      <h3 style={{ marginTop: 18 }}>Catalog</h3>
      {loading ? (
        <div className="row" style={{ justifyContent:"center" }}>
          <div className="spinner" /><span className="muted">Loading rewards…</span>
        </div>
      ) : (
        <div className="grid-3">
          {CATALOG.map(item => (
            <RewardCard
              key={item.id}
              item={item}
              canRedeem={canRedeem}
              onRedeem={redeem}
            />
          ))}
        </div>
      )}

      {/* Redemptions history (client-side) */}
      <h3 style={{ marginTop: 18 }}>My Redemptions</h3>
      {redemptions.length === 0 ? (
        <div className="card" style={{ padding: 16, color: "var(--muted)" }}>
          You haven’t redeemed anything yet.
        </div>
      ) : (
        <ul className="list">
          {redemptions.map(r => (
            <li key={r.code} className="row">
              <div>
                <strong>{r.name}</strong>{" "}
                <span className="badge">{r.cost} pts</span>
                <div className="muted">
                  Code: {r.code} · {new Date(r.ts).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Rewards;
