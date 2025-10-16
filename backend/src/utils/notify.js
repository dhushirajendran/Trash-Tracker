import Notification from "../models/Notification.js";

export const pushNotification = async (userId, { type="info", title, message, meta={} }) => {
  return Notification.create({ user: userId, type, title, message, meta });
};
