// 404 not found handler
export const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};

// centralized error handler
export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err);
  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
