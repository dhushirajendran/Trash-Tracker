import React, { useState } from "react";
import { api } from "../utils/api";

const SpecialRequestForm = () => {
  const [type, setType] = useState("bulky");
  const [description, setDescription] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!preferredDate) e.preferredDate = "Preferred date is required";
    if (!["bulky","ewaste"].includes(type)) e.type = "Invalid type";
    if (description.length > 500) e.description = "Max 500 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true); setMsg("Submitting...");
    try {
      const res = await api.post("/api/special-requests", { type, description, preferredDate });
      setMsg(res.message || "Submitted");
      setDescription(""); setPreferredDate("");
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="container">
      <h1>Special Waste Collection</h1>
      {msg && <p className="alert">{msg}</p>}

      <form onSubmit={submit}>
        <div className="grid-2">
          <div>
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} disabled={loading}>
              <option value="bulky">Bulky</option>
              <option value="ewaste">E-Waste</option>
            </select>
            {errors.type && <div className="error">{errors.type}</div>}
          </div>

          <div>
            <label>Preferred Date</label>
            <input type="date" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} disabled={loading} />
            {errors.preferredDate && <div className="error">{errors.preferredDate}</div>}
          </div>
        </div>

        <label>Description (optional)</label>
        <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
        {errors.description && <div className="error">{errors.description}</div>}
        <div className="helper">Max 500 characters.</div>

        <div style={{ marginTop: 16, display:"flex", gap:10 }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Submitting…" : "Submit Request"}
          </button>
          <button type="button" className="btn-ghost" disabled={loading} onClick={()=>{ setDescription(""); setPreferredDate(""); }}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default SpecialRequestForm;
