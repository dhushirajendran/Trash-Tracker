export const getPaging = (req, { maxLimit = 50, defaultLimit = 10 } = {}) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit || String(defaultLimit), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildPaged = ({ items, total, page, limit }) => {
  const pages = Math.ceil(total / limit) || 1;
  return {
    meta: { page, limit, total, pages, hasNext: page < pages, hasPrev: page > 1 },
    data: items
  };
};
