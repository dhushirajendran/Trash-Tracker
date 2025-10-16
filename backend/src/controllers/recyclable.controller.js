// backend/src/controllers/recyclable.controller.js
import RecyclableSubmission from "../models/RecyclableSubmission.js";
import Payback from "../models/Payback.js";
import {
  createRecyclableSubmissionSchema,
  updateRecyclableSubmissionSchema,
} from "../validators/recyclable.schema.js";
import { calculatePayback } from "../utils/payback.js";
import { sendEmail } from "../utils/email.js";
import { buildRecyclableReceipt } from "../utils/receipt.js";
import { pushNotification } from "../utils/notify.js";
import { streamRecyclableReceiptPdf } from "../utils/pdf.js";
import { getPaging, buildPaged } from "../utils/pagination.js";


/**
 * Validate categories & weights, compute payback, and save.
 * Covers extension 4A via Joi validation errors.
 */
export const createRecyclableSubmission = async (req, res, next) => {
  try {
    const { error, value } = createRecyclableSubmissionSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details });

    const total = value.items.reduce(
      (sum, item) => sum + calculatePayback(item.category, item.weightKG),
      0
    );

    const doc = await RecyclableSubmission.create({
      resident: req.user._id,
      items: value.items,
      totalPayback: total,
    });

    return res.status(201).json({ message: "Submission received", data: doc });
  } catch (e) {
    return next(e);
  }
};

export const listRecyclableSubmissions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req, { defaultLimit: 10, maxLimit: 100 });
    const where = { resident: req.user._id };
    const [items, total] = await Promise.all([
      RecyclableSubmission.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RecyclableSubmission.countDocuments(where),
    ]);
    return res.json(buildPaged({ items, total, page, limit }));
  } catch (e) { return next(e); }
};

/**
 * Allow update/cancel before processing
 */
export const updateRecyclableSubmission = async (req, res, next) => {
  try {
    const { error, value } = updateRecyclableSubmissionSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details });

    const doc = await RecyclableSubmission.findOne({ _id: req.params.id, resident: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (!["submitted", "processing"].includes(doc.status)) {
      return res.status(409).json({ message: "Only submitted/processing items can be updated/canceled" });
    }

    if (value.items) {
      doc.items = value.items;
      doc.totalPayback = value.items.reduce(
        (sum, i) => sum + calculatePayback(i.category, i.weightKG),
        0
      );
    }
    if (value.status === "canceled") doc.status = "canceled";

    await doc.save();
    return res.json({ message: "Submission updated", data: doc });
  } catch (e) {
    return next(e);
  }
};

/**
 * Mark as completed -> credit payback & generate receipt
 * Handles 10/10A (credit failure is logged & user notified)
 */
export const completeRecyclableSubmission = async (req, res, next) => {
  try {
    const doc = await RecyclableSubmission.findOne({ _id: req.params.id, resident: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status === "completed") {
      return res.status(409).json({ message: "Already completed" });
    }

    // finalize submission
    doc.status = "completed";
    doc.receiptNo = `RCPT-${Date.now()}`;
    await doc.save();

    const receipt = buildRecyclableReceipt(doc);

    // Try to credit payback
    try {
      const pay = await Payback.create({
        resident: req.user._id,
        submission: doc._id,
        amount: doc.totalPayback,
        reason: "Recyclable payback",
        status: "credited",
      });

      await sendEmail({
        to: req.user.email,
        subject: `Recyclable Receipt ${doc.receiptNo}`,
        html: `<h3>Thank you for recycling!</h3>
               <p>Receipt: <strong>${doc.receiptNo}</strong></p>
               <p>Total Payback: Rs. ${doc.totalPayback.toFixed(2)}</p>`,
      });

      await pushNotification(req.user._id, {
        type: "success",
        title: "Recyclables completed",
        message: `Receipt ${doc.receiptNo} | Rs. ${doc.totalPayback.toFixed(2)}`,
        meta: { submissionId: doc._id, receiptNo: doc.receiptNo, total: doc.totalPayback }
      });

      return res.json({
        message: "Submission completed. Payback credited.",
        data: { submission: doc, payback: pay, receipt },
      });
    } catch (creditErr) {
      const pay = await Payback.create({
        resident: req.user._id,
        submission: doc._id,
        amount: doc.totalPayback,
        reason: "Recyclable payback",
        status: "failed",
        error: creditErr.message,
      });

      await sendEmail({
        to: req.user.email,
        subject: `Recyclable Receipt (credit failed) ${doc.receiptNo}`,
        html: `<p>Your submission was completed but crediting failed. Our team has been notified.</p>
               <p>Receipt: <strong>${doc.receiptNo}</strong></p>`,
      });

      await pushNotification(req.user._id, {
        type: "error",
        title: "Payback credit failed",
        message: `Receipt ${doc.receiptNo} logged; retry pending.`,
        meta: { submissionId: doc._id, receiptNo: doc.receiptNo }
      });

      return res.status(502).json({
        message: "Submission closed but credit failed (logged).",
        data: { submission: doc, payback: pay, receipt },
      });
    }
  } catch (e) {
    return next(e);
  }
};

/** Downloadable JSON receipt (only after completion) */
export const getRecyclableReceipt = async (req, res, next) => {
  try {
    const doc = await RecyclableSubmission.findOne({ _id: req.params.id, resident: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status !== "completed") {
      return res.status(409).json({ message: "Receipt available only after completion" });
    }
    const receipt = buildRecyclableReceipt(doc);
    return res.json({ data: receipt });
  } catch (e) {
    return next(e);
  }
};

export const getRecyclableReceiptPdf = async (req, res, next) => {
  try {
    const doc = await RecyclableSubmission.findOne({ _id: req.params.id, resident: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.status !== "completed") {
      return res.status(409).json({ message: "Receipt available only after completion" });
    }
    // stream a PDF to the response
    streamRecyclableReceiptPdf({ res, submission: doc, user: req.user });
  } catch (e) {
    next(e);
  }
};

