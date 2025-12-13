const express = require("express");
const router = express.Router();

const Session = require("../models/session");
const KycDocument = require("../models/kycDocument");
const { evaluateKYC } = require("../tools/kyc");

// -------------------------
// POST /api/documents/upload
// -------------------------
router.post("/upload", async (req, res) => {
  try {
    const { session_id, pan, salary, employer } = req.body;

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
      pan,
      salary,
    });

    // 4️⃣ Save KYC document
    await KycDocument.create({
      session_id,
      pan,
      salary,
      employer,
      kyc_status,
      risk_score,
    });

    // 5️⃣ Update session with FACTS
    session.kyc_status = kyc_status;
    session.risk_score = risk_score;
    session.stage = "kyc_verification";
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
});

module.exports = router;
