import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["info","success","warning","error"], default: "info" },
  title: { type: String, required: true },
  message: { type: String, required: true },
  meta: { type: Object, default: {} },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);
