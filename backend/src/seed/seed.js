import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

import User from "../models/User.js";
import SpecialRequest from "../models/SpecialRequest.js";
import RecyclableSubmission from "../models/RecyclableSubmission.js";
import Payback from "../models/Payback.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/trashtrack_dev";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to Mongo");

  // Clean
  await Promise.all([
    User.deleteMany({ email: { $in: ["admin@tt.local", "res@tt.local"] } }),
    SpecialRequest.deleteMany({}),
    RecyclableSubmission.deleteMany({}),
    Payback.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash("pass123", 10);
  const admin = await User.create({
    name: "Admin",
    email: "admin@tt.local",
    role: "admin",
    passwordHash,
    address: { city: "Colombo", municipalAreaId: "CMC-01" }
  });

  const resident = await User.create({
    name: "Resident",
    email: "res@tt.local",
    role: "resident",
    passwordHash,
    address: { city: "Colombo", municipalAreaId: "CMC-01" }
  });

  const today = new Date();
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = new Date(d); d2.setDate(d2.getDate() + 1);

  await SpecialRequest.create([
    { resident: resident._id, type: "bulky", preferredDate: d, scheduledDate: d, status: "scheduled", description: "Old sofa" },
    { resident: resident._id, type: "ewaste", preferredDate: d2, scheduledDate: d2, status: "pending", description: "CRT monitor" }
  ]);

  const sub1 = await RecyclableSubmission.create({
    resident: resident._id,
    items: [{ category: "plastic", weightKG: 2.5 }, { category: "paper", weightKG: 1.2 }],
    totalPayback: 2.5*40 + 1.2*20,
    status: "completed",
    receiptNo: `RCPT-${Date.now()}`
  });
  await Payback.create({
    resident: resident._id,
    submission: sub1._id,
    amount: sub1.totalPayback,
    reason: "Recyclable payback",
    status: "credited"
  });

  console.log("Seed complete.");
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
