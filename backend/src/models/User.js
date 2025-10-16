import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email:  { type: String, required: true, unique: true },
    name:   { type: String, required: true },
    passwordHash: { type: String, required: true },
    role:   { type: String, enum: ["resident", "admin"], default: "resident" },
    address: {
      line1: String,
      line2: String,
      city: String,
      postalCode: String,
      municipalAreaId: { type: String }
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
