import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import Notification from "../models/Notification.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const docs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100);
    res.json({ data: docs });
  } catch (e) { next(e); }
});

router.post("/:id/read", async (req, res, next) => {
  try {
    const doc = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    doc.isRead = true;
    await doc.save();
    res.json({ message: "Marked as read", data: doc });
  } catch (e) { next(e); }
});

export default router;
