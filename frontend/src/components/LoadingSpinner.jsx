import React from "react";
const LoadingSpinner = ({ label = "Loading…" }) => (
  <div style={{ padding: 16, display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      border: "2px solid #ddd", borderTopColor: "#333",
      animation: "ttspin 1s linear infinite"
    }} />
    <span>{label}</span>
    <style>{`@keyframes ttspin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
export default LoadingSpinner;
