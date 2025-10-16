import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import healthRoutes from "./routes/health.routes.js";
import { notFound, errorHandler } from "./middlewares/error.js";
import specialRoutes from "./routes/special.routes.js";
import recyclableRoutes from "./routes/recyclable.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

// core middlewares
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// routes
app.use("/api/health", healthRoutes);

// health root (quick check)
app.get("/", (req, res) => {
  res.send("TrashTrack API is running 🚛♻️");
});

app.use("/api/special-requests", specialRoutes);
app.use("/api/recyclables", recyclableRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);


// errors
app.use(notFound);
app.use(errorHandler);

// start
const PORT = process.env.PORT || 5000;
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};
start();
