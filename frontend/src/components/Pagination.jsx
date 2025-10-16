import React from "react";
const Pagination = ({ meta, onPage }) => {
  if (!meta) return null;
  const { page, pages, hasPrev, hasNext } = meta;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", margin: "12px 0" }}>
      <button disabled={!hasPrev} onClick={() => hasPrev && onPage(page - 1)}>Prev</button>
      <span style={{ color: "var(--muted)" }}>{page} / {pages}</span>
      <button disabled={!hasNext} onClick={() => hasNext && onPage(page + 1)}>Next</button>
    </div>
  );
};
export default Pagination;
