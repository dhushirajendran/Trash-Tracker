import mongoose from "mongoose";
import { SUBMISSION_STATUS, RECYCLABLE_CATEGORIES } from "../utils/constants.js";

const recyclableItemSchema = new mongoose.Schema(
  {
    category: { type: String, enum: RECYCLABLE_CATEGORIES, required: true },
    weightKG: { type: Number, min: 0, required: true }
  },
  { _id: false }
);

const recyclableSubmissionSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [recyclableItemSchema], validate: v => v.length > 0 },
    status: { type: String, enum: SUBMISSION_STATUS, default: "submitted" },
    totalPayback: { type: Number, default: 0 }, // calculated
    receiptNo: { type: String }                 // generated when completed
  },
  { timestamps: true }
);

export default mongoose.model("RecyclableSubmission", recyclableSubmissionSchema);
