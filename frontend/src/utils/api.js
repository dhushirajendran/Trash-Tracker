// frontend/src/utils/api.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const parse = async (res) => {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
};

const authHeaders = (json = true) => {
  const token = localStorage.getItem("tt_token");
  const h = new Headers();
  if (json) h.set("Content-Type", "application/json");
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
};

export const api = {
  // JSON helpers
  get: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(true) });
    if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
    return parse(res);
  },

  post: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`);
    return parse(res);
  },

  patch: async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PATCH",
      headers: authHeaders(true),
      body: JSON.stringify(body ?? {}),
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed (${res.status})`);
    return parse(res);
  },

  postNoBody: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(false),
    });
    if (!res.ok) throw new Error(`POST ${path} failed (${res.status})`);
    return parse(res);
  },

  del: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
      headers: authHeaders(false),
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed (${res.status})`);
    return parse(res);
  },

  // NEW: blob download with Authorization header
  getBlob: async (path) => {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders(false) });
    if (!res.ok) throw new Error(`GET (blob) ${path} failed (${res.status})`);
    return res.blob();
  },
};
