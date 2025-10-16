import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  createRecyclableSubmission,
  listRecyclableSubmissions,
  updateRecyclableSubmission,
  completeRecyclableSubmission,
  getRecyclableReceipt,
  getRecyclableReceiptPdf
} from "../controllers/recyclable.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", listRecyclableSubmissions);
router.post("/", createRecyclableSubmission);
router.get("/:id/receipt", getRecyclableReceipt);
router.get("/:id/receipt.pdf", getRecyclableReceiptPdf);


// Keep the receipt route explicit:
router.get("/:id/receipt", getRecyclableReceipt);

router.patch("/:id", updateRecyclableSubmission);
router.post("/:id/complete", completeRecyclableSubmission);

export default router;
