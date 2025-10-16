import { Router } from "express";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import {
  adminListSpecialRequests,
  adminScheduleSpecialRequest,
  adminUpdateSpecialStatus,
  adminGetCapacity,
  adminPaybackReport
} from "../controllers/admin.controller.js";

const router = Router();

router.use(requireAuth, requireAdmin);

// Requests queue
router.get("/special-requests", adminListSpecialRequests);
router.patch("/special-requests/:id/schedule", adminScheduleSpecialRequest);
router.patch("/special-requests/:id/status", adminUpdateSpecialStatus);

// Capacity
router.get("/capacity", adminGetCapacity);

// Reports
router.get("/reports/paybacks", adminPaybackReport);

export default router;
