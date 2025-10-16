import mongoose from "mongoose";

const paybackSchema = new mongoose.Schema(
  {
    resident: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    submission: { type: mongoose.Schema.Types.ObjectId, ref: "RecyclableSubmission" },
    amount: { type: Number, required: true }, // positive credit
    reason: { type: String, default: "Recyclable payback" },
    status: { type: String, enum: ["credited", "failed"], default: "credited" },
    error: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Payback", paybackSchema);
