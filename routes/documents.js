const express = require("express");
const router = express.Router();

const multer = require("multer");

const Session = require("../models/session");
const KycDocument = require("../models/kycDocument");
const { evaluateKYC } = require("../tools/kyc");

// -------------------------
// Multer config (PDF / Image upload)
// -------------------------
const upload = multer({
  storage: multer.memoryStorage(), // MVP-safe
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// -------------------------
// POST /api/documents/upload
// -------------------------
router.post(
  "/upload",
  upload.fields([
    { name: "pan", maxCount: 1 },
    { name: "salary", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { session_id, employer } = req.body;
      const pan = req.files?.pan?.[0];
      const salary = req.files?.salary?.[0];

      // 1️⃣ Validate request
      if (!session_id || !pan || !salary) {
        return res.status(400).json({
          error: "session_id, pan, and salary are required",
        });
      }

      // 2️⃣ Load session
      const session = await Session.findOne({ session_id });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // 3️⃣ Factual KYC (TOOL ONLY)
      const { kyc_status, risk_score } = evaluateKYC({
        pan: pan.originalname,
        salary: salary.originalname,
      });

      // 4️⃣ Save KYC document
      await KycDocument.create({
        session_id,
        pan: pan.originalname,
        salary: salary.originalname,
        employer,
        kyc_status,
        risk_score,
      });

      // 5️⃣ Update session with FACTS
      session.kyc_status = kyc_status;
      session.risk_score = risk_score;

      // 🔑 MVP AUTO-FLOW AFTER KYC
      if (kyc_status === "verified") {
        session.offers = [
          {
            offer_id: `offer_${Date.now()}`,
            amount: session.loan_amount,
            tenure_months: 24,
            interest_rate: 10.5,
            status: "approved",
          },
        ];
        session.stage = "sanction";
      } else {
        session.stage = "kyc_verification";
      }

      await session.save();

      // 6️⃣ Response
      res.status(200).json({
        message: "KYC processed successfully",
        kyc_status,
        risk_score,
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
