import SpecialRequest from "../models/SpecialRequest.js";
import RecyclableSubmission from "../models/RecyclableSubmission.js";
import Payback from "../models/Payback.js";
import { getPaging, buildPaged } from "../utils/pagination.js";

// simple max/day; keep in sync with special.controller.js
const MAX_PER_DAY = 20;

const dayBounds = (iso) => {
  const d = new Date(iso);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);
  return { start, end };
};

/** GET /api/admin/special-requests?status=&type=&dateFrom=&dateTo=&q= */
export const adminListSpecialRequests = async (req, res, next) => {
  try {
    const { status, type, dateFrom, dateTo, q } = req.query;
    const { page, limit, skip } = getPaging(req, { defaultLimit: 15, maxLimit: 200 });

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (dateFrom || dateTo) {
      query.scheduledDate = {};
      if (dateFrom) query.scheduledDate.$gte = new Date(dateFrom);
      if (dateTo)   query.scheduledDate.$lte = new Date(dateTo);
    }

    if (q) {
      const users = await (await import("../models/User.js")).default.find({
        email: { $regex: q, $options: "i" }
      }).select("_id");
      query.resident = { $in: users.map(u => u._id) };
    }

    const [items, total] = await Promise.all([
      SpecialRequest.find(query).populate("resident", "name email")
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      SpecialRequest.countDocuments(query),
    ]);

    res.json(buildPaged({ items, total, page, limit }));
  } catch (e) { next(e); }
};

/** PATCH /api/admin/special-requests/:id/schedule { scheduledDate } */
export const adminScheduleSpecialRequest = async (req, res, next) => {
  try {
    const { scheduledDate } = req.body;
    if (!scheduledDate) return res.status(400).json({ message: "scheduledDate required (YYYY-MM-DD)" });

    const doc = await SpecialRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    // capacity check for the day
    const { start, end } = dayBounds(scheduledDate);
    const count = await SpecialRequest.countDocuments({
      scheduledDate: { $gte: start, $lt: end },
      status: { $in: ["pending", "scheduled"] },
      _id: { $ne: doc._id }
    });
    if (count >= MAX_PER_DAY) {
      return res.status(409).json({ message: "Capacity full for that day" });
    }

    doc.scheduledDate = start;
    doc.status = "scheduled";
    doc.alternatives = [];
    doc.conflictNote = undefined;
    await doc.save();

    res.json({ message: "Request scheduled", data: doc });
  } catch (e) { next(e); }
};

/** PATCH /api/admin/special-requests/:id/status { status } -> completed|canceled */
export const adminUpdateSpecialStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["completed", "canceled"].includes(status))
      return res.status(400).json({ message: "status must be completed|canceled" });

    const doc = await SpecialRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    doc.status = status;
    await doc.save();
    res.json({ message: "Status updated", data: doc });
  } catch (e) { next(e); }
};

/** GET /api/admin/capacity?date=YYYY-MM-DD */
export const adminGetCapacity = async (req, res, next) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0,10);
    const { start, end } = dayBounds(date);
    const scheduled = await SpecialRequest.countDocuments({
      scheduledDate: { $gte: start, $lt: end },
      status: { $in: ["pending","scheduled"] }
    });
    res.json({
      data: {
        date: date,
        scheduledCount: scheduled,
        maxPerDay: MAX_PER_DAY,
        remaining: Math.max(0, MAX_PER_DAY - scheduled),
      }
    });
  } catch (e) { next(e); }
};

/** GET /api/admin/reports/paybacks?from=&to= */
export const adminPaybackReport = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to)   match.createdAt.$lte = new Date(to);

    const [agg] = await Payback.aggregate([
      { $match: match },
      { $group: {
          _id: "$status",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
      }},
    ]);

    const rows = await Payback.aggregate([
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $limit: 100 },
      { $lookup: { from: "recyclablesubmissions", localField: "submission", foreignField: "_id", as: "submission" } },
      { $unwind: { path: "$submission", preserveNullAndEmptyArrays: true } }
    ]);

    // summarize credited/failed
    const totals = { credited: 0, failed: 0, creditedCount: 0, failedCount: 0 };
    (await Payback.aggregate([
      { $match: match },
      { $group: { _id: "$status", sum: { $sum: "$amount" }, count: { $sum: 1 } } }
    ])).forEach(r => {
      if (r._id === "credited") { totals.credited = r.sum; totals.creditedCount = r.count; }
      if (r._id === "failed")   { totals.failed   = r.sum; totals.failedCount   = r.count; }
    });

    res.json({ data: { totals, latest: rows }});
  } catch (e) { next(e); }
};
