import React from "react";

const StatCard = ({ label, value, hint, tone = "default" }) => {
  const toneStyle =
    tone === "success" ? { background: "#ecfdf5", borderColor: "#bbf7d0", color: "#065f46" } :
    tone === "warning" ? { background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" } :
    tone === "danger"  ? { background: "#fef2f2", borderColor: "#fecaca", color: "#7f1d1d" } :
    { background: "#eef6ff", borderColor: "#cfe6fb", color: "#0b2540" };

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{value}</div>
      {hint && (
        <div style={{
          marginTop: 10, padding: "8px 10px", borderRadius: 10,
          border: `1px solid ${toneStyle.borderColor}`, background: toneStyle.background, color: toneStyle.color,
          fontSize: 12
        }}>
          {hint}
        </div>
      )}
    </div>
  );
};

export default StatCard;
