import mongoose from "mongoose";
import { REQUEST_STATUS, SPECIAL_TYPES } from "../utils/constants.js";

const specialRequestSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: SPECIAL_TYPES, required: true },
    description: { type: String },
    preferredDate: { type: Date, required: true },
    scheduledDate: { type: Date }, // final date used for routing
    status: { type: String, enum: REQUEST_STATUS, default: "pending" },

    // NEW: admin/ops visibility
    alternatives: [{ type: Date }],     // proposed alternative dates if preferred was full
    conflictNote: { type: String }      // “capacity full”, “truck unavailable”, etc.
  },
  { timestamps: true }
);

export default mongoose.model("SpecialRequest", specialRequestSchema);
