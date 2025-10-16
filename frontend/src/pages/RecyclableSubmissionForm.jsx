import React, { useMemo, useState } from "react";
import { api } from "../utils/api";

const emptyItem = { category: "plastic", weightKG: "" };
const rates = { plastic: 40, paper: 20, glass: 10, metal: 70, ewaste: 0 };

const RecyclableSubmissionForm = () => {
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [msg, setMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const totalPreview = useMemo(
    () => items.reduce((sum, it) => sum + (rates[it.category] || 0) * (Number(it.weightKG) || 0), 0),
    [items]
  );

  const validate = () => {
    const e = {};
    if (items.length === 0) e.items = "Add at least one item";
    items.forEach((it, idx) => {
      if (!["plastic","paper","glass","metal","ewaste"].includes(it.category)) e[`category_${idx}`] = "Invalid";
      if (!it.weightKG || Number(it.weightKG) <= 0) e[`weight_${idx}`] = "Enter weight > 0";
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const updateItem = (idx, key, value) => {
    const next = items.slice(); next[idx][key] = value; setItems(next);
  };
  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setMsg("Submitting...");
    const payload = { items: items.map(i => ({ category: i.category, weightKG: Number(i.weightKG) })) };
    try {
      const res = await api.post("/api/recyclables", payload);
      setMsg(`${res.message} | Estimated payback: Rs. ${Number(res.data.totalPayback || 0).toFixed(2)}`);
      setItems([{ ...emptyItem }]);
    } catch (err) { setMsg(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="container">
      <h1>Recyclable Submission</h1>
      <div className="badge">Preview payback: Rs. {totalPreview.toFixed(2)}</div>
      {msg && <p className="alert" style={{ marginTop: 10 }}>{msg}</p>}

      <form onSubmit={submit}>
        {items.map((it, idx) => (
          <div key={idx} className="row">
            <div className="grid-3" style={{ width:"100%" }}>
              <div>
                <label>Category</label>
                <select value={it.category} onChange={(e) => updateItem(idx, "category", e.target.value)} disabled={loading}>
                  <option>plastic</option><option>paper</option><option>glass</option><option>metal</option><option>ewaste</option>
                </select>
                {errors[`category_${idx}`] && <div className="error">{errors[`category_${idx}`]}</div>}
              </div>
              <div>
                <label>Weight (kg)</label>
                <input type="number" step="0.01" min="0.01" value={it.weightKG}
                       onChange={(e) => updateItem(idx, "weightKG", e.target.value)} disabled={loading} />
                {errors[`weight_${idx}`] && <div className="error">{errors[`weight_${idx}`]}</div>}
                <div className="helper">Rate: Rs. {rates[it.category] || 0} / kg</div>
              </div>
              <div style={{ display:"flex", alignItems:"flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => removeItem(idx)} disabled={loading}>Remove</button>
              </div>
            </div>
          </div>
        ))}
        {errors.items && <div className="error" style={{ marginTop:6 }}>{errors.items}</div>}

        <div style={{ display:"flex", gap:10, marginTop: 10 }}>
          <button type="button" className="btn-ghost" onClick={addItem} disabled={loading}>+ Add Item</button>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Submitting..." : "Submit Recyclables"}</button>
        </div>
      </form>
    </div>
  );
};

export default RecyclableSubmissionForm;
