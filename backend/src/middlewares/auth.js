import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_replace_in_prod";

export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Prefer Authorization header
    const auth = req.headers.authorization || "";
    if (auth.startsWith("Bearer ")) token = auth.slice(7);

    // Fallback for GET links: ?token=...
    if (!token && req.method === "GET" && req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) return res.status(401).json({ message: "Missing token" });

    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized", error: e.message });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  next();
};
