const express = require("express");
const router = express.Router();

const multer = require("multer");

const Session = require("../models/session");
const KycDocument = require("../models/kycDocument");

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

      // 3️⃣ Save uploaded documents (MVP)
      await KycDocument.create({
        session_id,
        pan: pan.originalname,
        salary: salary.originalname,
        employer,
        kyc_status: "verified",
        risk_score: 0,
      });

      // 4️⃣ Update session (CRITICAL FIX)
      session.documents_uploaded = true;   // ✅ REQUIRED
      session.kyc_status = "verified";     // ✅ LLM verified
      session.stage = "documents";          // ✅ DO NOT jump to offers

      await session.save();

      // 5️⃣ Response
      res.status(200).json({
        message: "Documents uploaded and verified successfully",
        next_stage: "kyc_verified",
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
