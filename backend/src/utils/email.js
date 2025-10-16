// Minimal stub for later integration (e.g., Nodemailer, SendGrid).
export const sendEmail = async ({ to, subject, html }) => {
  // For now, just log. Replace with actual provider later.
  console.log("📧 [DEV-EMAIL]", { to, subject });
  // Simulate async delay
  return Promise.resolve({ ok: true });
};
