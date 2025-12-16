const express = require("express");
const router = express.Router();
const multer = require("multer");

const Session = require("../models/session");
const KycDocument = require("../models/kycDocument");

// -------------------------
// Multer config
// -------------------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// -------------------------
// POST /api/documents/upload
// -------------------------
router.post(
  "/upload",
  upload.array("files", 5), // ✅ MATCH FRONTEND
  async (req, res) => {
    try {
      const { session_id, employer } = req.body;
      const files = req.files;

      // 1️⃣ Validate request
      if (!session_id || !files || files.length === 0) {
        return res.status(400).json({
          error: "session_id and files are required",
        });
      }

      // 2️⃣ Load session
      const session = await Session.findOne({ session_id });
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // 3️⃣ Save uploaded docs (MVP-safe)
      await KycDocument.create({
        session_id,
        documents: files.map((f) => f.originalname),
        employer,
        kyc_status: "verified",
        risk_score: 0,
      });

      // 4️⃣ 🔒 CRITICAL: lock document upload
      session.documents_uploaded = true;
      session.kyc_status = "verified";
      session.stage = "documents"; // chat.js will move forward

      await session.save();

      // 5️⃣ Response
      res.status(200).json({
        message: "Documents uploaded successfully",
      });
    } catch (error) {
      console.error("Document upload error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
