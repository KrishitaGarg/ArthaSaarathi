const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateSanctionPDF(session) {
  const sanctionsDir = path.join(__dirname, "../public/sanctions");

  // Ensure directory exists
  if (!fs.existsSync(sanctionsDir)) {
    fs.mkdirSync(sanctionsDir, { recursive: true });
  }

  const fileName = `sanction_${session.session_id}.pdf`;
  const filePath = path.join(sanctionsDir, fileName);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  // ---------------- PDF CONTENT ----------------
  doc
    .fontSize(20)
    .text("ArthaSaarthi Loan Sanction Letter", { align: "center" });

  doc.moveDown(2);

  doc.fontSize(12);
  doc.text(`Name: ${session.name}`);
  doc.text(`Phone: ${session.phone}`);
  doc.text(`Loan Amount Sanctioned: ₹${session.loan_amount}`);
  doc.text(`Monthly Income: ₹${session.income}`);

  doc.moveDown();

  doc.text(`Sanction ID: SANC-${session.session_id}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown(2);

  doc.text(
    "We are pleased to inform you that your loan application has been approved. " +
      "This sanction letter is generated electronically and does not require a signature.",
    { align: "justify" }
  );

  doc.moveDown(3);

  doc.text("Best Regards,", { align: "left" });
  doc.text("ArthaSaarthi Loan Department");

  doc.end();

  // ✅ PUBLIC URL
  return `/sanctions/${fileName}`;
}

module.exports = { generateSanctionPDF };
