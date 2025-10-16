import PDFDocument from "pdfkit";

export const streamRecyclableReceiptPdf = ({ res, submission, user }) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Stream headers
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${submission.receiptNo || "receipt"}.pdf"`
  );
  doc.pipe(res);

  // Header
  doc
    .fontSize(20)
    .text("TrashTrack - Recyclable Receipt", { align: "center" })
    .moveDown(0.5);

  // Meta block
  doc
    .fontSize(12)
    .text(`Receipt No: ${submission.receiptNo || "-"}`)
    .text(`Date: ${new Date(submission.updatedAt || submission.createdAt).toLocaleString()}`)
    .text(`Resident: ${user?.name || "Resident"} (${user?.email || "N/A"})`)
    .moveDown(1);

  // Items table header
  doc.fontSize(14).text("Items", { underline: true }).moveDown(0.5);
  doc.fontSize(12);

  // Simple table columns
  const col1 = 50;   // Category
  const col2 = 300;  // Weight (kg)
  const col3 = 430;  // Rate
  const col4 = 510;  // Amount

  doc.text("Category", col1).text("Weight (kg)", col2).text("Rate (LKR/kg)", col3).text("Amount (LKR)", col4);
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor("#cccccc").stroke().moveDown(0.3);

  // Body rows
  const rates = { plastic: 40, paper: 20, glass: 10, metal: 70, ewaste: 0 };
  let running = 0;

  (submission.items || []).forEach((it) => {
    const rate = rates[it.category] ?? 0;
    const amount = rate * Number(it.weightKG || 0);
    running += amount;

    doc
      .fillColor("#000000")
      .text(it.category, col1)
      .text(Number(it.weightKG || 0).toFixed(2), col2)
      .text(rate.toFixed(2), col3)
      .text(amount.toFixed(2), col4);

    doc.moveDown(0.15);
  });

  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor("#cccccc").stroke().moveDown(0.5);

  // Totals
  doc
    .fontSize(13)
    .text("Total Payback (LKR):", col3)
    .font("Helvetica-Bold")
    .text((submission.totalPayback ?? running).toFixed(2), col4)
    .font("Helvetica")
    .moveDown(1);

  // Footer
  doc
    .fontSize(10)
    .fillColor("#555555")
    .text("Thank you for recycling with TrashTrack. This is a system-generated receipt.", 50, 760, {
      align: "center",
      width: 500,
    });

  doc.end(); // finalize
};
