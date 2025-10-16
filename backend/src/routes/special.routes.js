import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  createSpecialRequest,
  listSpecialRequests,
  updateSpecialRequest
} from "../controllers/special.controller.js";
import { checkAvailability, cancelSpecialRequest } from "../controllers/special.controller.js";


const router = Router();

router.use(requireAuth);
router.get("/", listSpecialRequests);
router.post("/", createSpecialRequest);
router.patch("/:id", updateSpecialRequest);
router.get("/availability", checkAvailability);
router.post("/:id/cancel", cancelSpecialRequest);

export default router;
