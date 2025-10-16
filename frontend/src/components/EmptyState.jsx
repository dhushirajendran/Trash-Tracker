import React from "react";
const EmptyState = ({ title = "Nothing here yet", hint }) => (
  <div className="card" style={{ padding: 16, textAlign: "center", color: "var(--muted)" }}>
    <h3 style={{ marginTop: 0 }}>{title}</h3>
    {hint && <p>{hint}</p>}
  </div>
);
export default EmptyState;
