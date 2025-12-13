const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateSanctionPDF({ session, offer }) {
  const sanctionsDir = path.join(__dirname, "../public/sanctions");

  if (!fs.existsSync(sanctionsDir)) {
    fs.mkdirSync(sanctionsDir, { recursive: true });
  }

  const fileName = `sanction_${session.session_id}.pdf`;
  const filePath = path.join(sanctionsDir, fileName);

  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  // -------- PDF CONTENT --------
  doc.fontSize(20).text("ArthaSaarthi Loan Sanction Letter", {
    align: "center",
  });

  doc.moveDown(2);

  doc.fontSize(12);
  doc.text(`Name: ${session.name || "Customer"}`);
  doc.text(`Loan Amount: ₹${offer.amount}`);
  doc.text(`Tenure: ${offer.tenure} months`);
  doc.text(`Interest Rate: ${offer.rate}%`);
  doc.text(`EMI: ₹${offer.emi}`);

  doc.moveDown();

  doc.text(`Sanction ID: SANC-${session.session_id}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);

  doc.moveDown(2);
  doc.text(
    "This is a system-generated sanction letter for demo purposes.",
    { align: "center" }
  );

  doc.end();

  return `/public/sanctions/${fileName}`;
}

module.exports = { generateSanctionPDF };
