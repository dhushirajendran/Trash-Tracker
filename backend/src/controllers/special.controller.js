// backend/src/controllers/special.controller.js
import SpecialRequest from "../models/SpecialRequest.js";
import {
  createSpecialRequestSchema,
  updateSpecialRequestSchema,
} from "../validators/specialRequest.schema.js";
import { REQUEST_STATUS } from "../utils/constants.js";
import { sendEmail } from "../utils/email.js";
import { pushNotification } from "../utils/notify.js";
import { getPaging, buildPaged } from "../utils/pagination.js";

/** Capacity per day (simple conflict rule) */
const MAX_PER_DAY = 20;

const dayWindow = (d) => {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
};

/** Collect next N available dates (including preferred day if available) */
const collectNextAvailableDates = async (baseDate, needed = 3) => {
  const out = [];
  let probe = new Date(baseDate);
  for (let i = 0; i < 14 && out.length < needed; i++) {
    const { start, end } = dayWindow(probe);
    const count = await SpecialRequest.countDocuments({
      scheduledDate: { $gte: start, $lt: end },
      status: { $in: ["pending", "scheduled"] },
    });
    if (count < MAX_PER_DAY) out.push(start);
    probe.setDate(probe.getDate() + 1);
  }
  return out;
};

/** Create special request (handles 4B: propose alternatives when full) */
export const createSpecialRequest = async (req, res, next) => {
  try {
    const { error, value } = createSpecialRequestSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details });

    const { preferredDate } = value;
    const suggestions = await collectNextAvailableDates(preferredDate, 3);
    if (suggestions.length === 0) {
      return res.status(409).json({ message: "No available dates within 2 weeks." });
    }

    const preferredStart = new Date(new Date(preferredDate).setHours(0, 0, 0, 0));
    const isPreferredAvailable = suggestions.some(d => d.getTime() === preferredStart.getTime());
    const scheduledDate = isPreferredAvailable ? preferredStart : suggestions[0];

    const doc = await SpecialRequest.create({
      resident: req.user._id,
      ...value,
      scheduledDate,
      status: isPreferredAvailable ? "scheduled" : "pending",
      alternatives: isPreferredAvailable ? [] : suggestions,
      conflictNote: isPreferredAvailable ? undefined : "Preferred date full; proposed alternatives."
    });

    await pushNotification(req.user._id, {
      type: "success",
      title: "Special request submitted",
      message: isPreferredAvailable
        ? `Scheduled for ${scheduledDate.toDateString()}`
        : "Preferred date unavailable. Alternatives proposed.",
      meta: { requestId: doc._id, scheduledDate, alternatives: doc.alternatives }
    });

    return res.status(201).json({
      message: isPreferredAvailable ? "Request scheduled." : "Alternative date proposed and saved as pending.",
      data: doc
    });
  } catch (e) {
    return next(e);
  }
};

/** List resident's special requests */
export const listSpecialRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaging(req, { defaultLimit: 10, maxLimit: 100 });
    const where = { resident: req.user._id };
    const [items, total] = await Promise.all([
      SpecialRequest.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SpecialRequest.countDocuments(where),
    ]);
    return res.json(buildPaged({ items, total, page, limit }));
  } catch (e) { return next(e); }
};

/** Update description/date or cancel (only while pending/scheduled) */
export const updateSpecialRequest = async (req, res, next) => {
  try {
    const { error, value } = updateSpecialRequestSchema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ errors: error.details });

    const doc = await SpecialRequest.findOne({ _id: req.params.id, resident: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (!["pending", "scheduled"].includes(doc.status)) {
      return res.status(409).json({ message: "Only pending/scheduled requests can be updated/canceled" });
    }

    // If user provides a new preferredDate, re-check capacity and (re)schedule
    if (value.preferredDate) {
      const suggestions = await collectNextAvailableDates(value.preferredDate, 3);
      const preferredStart = new Date(new Date(value.preferredDate).setHours(0, 0, 0, 0));
      const isPreferredAvailable = suggestions.some(d => d.getTime() === preferredStart.getTime());
      doc.scheduledDate = isPreferredAvailable ? preferredStart : suggestions[0];
      doc.alternatives = isPreferredAvailable ? [] : suggestions;
      doc.conflictNote = isPreferredAvailable ? undefined : "Preferred date full; proposed alternatives.";
      doc.preferredDate = value.preferredDate;
    }

    if (value.description !== undefined) doc.description = value.description;
    if (value.status === "canceled") doc.status = "canceled";

    await doc.save();
    return res.json({ message: "Request updated", data: doc });
  } catch (e) {
    return next(e);
  }
};

/** Availability probe: returns up to 5 dates from given date */
export const checkAvailability = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });

    const base = new Date(date);
    const suggestions = [];
    let probe = new Date(base);

    while (suggestions.length < 5) {
      const { start, end } = dayWindow(probe);
      const count = await SpecialRequest.countDocuments({
        scheduledDate: { $gte: start, $lt: end },
        status: { $in: ["pending", "scheduled"] },
      });
      if (count < MAX_PER_DAY) suggestions.push(start.toISOString().slice(0, 10));
      probe.setDate(probe.getDate() + 1);
      if (suggestions.length === 10) break; // safety
    }
    return res.json({ data: suggestions });
  } catch (e) {
    return next(e);
  }
};

/** Cancel request + notify user */
export const cancelSpecialRequest = async (req, res, next) => {
  try {
    const doc = await SpecialRequest.findOne({ _id: req.params.id, resident: req.user._id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (!["pending", "scheduled"].includes(doc.status)) {
      return res.status(409).json({ message: "Only pending/scheduled can be canceled" });
    }

    doc.status = "canceled";
    await doc.save();

    // email (stub) + in-app notification
    await sendEmail({
      to: req.user.email,
      subject: "Special Waste Request Canceled",
      html: `<p>Your request (${doc._id}) has been canceled.</p>`
    });

    await pushNotification(req.user._id, {
      type: "warning",
      title: "Special request canceled",
      message: `Request ${doc._id} is canceled.`,
      meta: { requestId: doc._id }
    });

    return res.json({ message: "Request canceled", data: doc });
  } catch (e) {
    return next(e);
  }
};
