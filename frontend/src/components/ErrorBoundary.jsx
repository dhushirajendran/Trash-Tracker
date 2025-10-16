import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError: false, err: null }; }
  static getDerivedStateFromError(err){ return { hasError: true, err }; }
  componentDidCatch(err, info){ console.error("UI crash:", err, info); }
  render(){
    if (this.state.hasError) {
      return (
        <div className="container">
          <div className="card" style={{ padding: 16 }}>
            <h3>Something went wrong</h3>
            <p style={{ color: "var(--muted)" }}>{String(this.state.err?.message || this.state.err)}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
