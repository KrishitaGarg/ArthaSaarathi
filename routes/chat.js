const express = require("express");
const router = express.Router();

const Session = require("../models/session");
const {
  decideNextActions,
  runAgents,
} = require("../orchestrator/masterOrchestrator");
const narrateConversation = require("../llm/narrator");

// --------------------
// Utilities
// --------------------
function extractNumber(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

// --------------------
// POST /api/chat/send
// --------------------
router.post("/send", async (req, res) => {
  try {
    const { session_id, message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    // --------------------
    // 1️⃣ Load or create session
    // --------------------
    let session = session_id
      ? await Session.findOne({ session_id })
      : null;

    const isFirstInteraction = !session;

    if (!session) {
      session = await Session.create({
        session_id: session_id || `sess_${Date.now()}`,
        stage: "inquiry",
      });
    }

    const msg = message.toLowerCase();

    // --------------------
    // 2️⃣ FACT EXTRACTION (ONLY in inquiry)
    // --------------------
    if (session.stage === "inquiry") {
      if (!session.name && msg.startsWith("my name is")) {
        session.name = message.replace(/my name is/i, "").trim();
      }

      if (!session.phone) {
        const phoneMatch = msg.match(/\b\d{10}\b/);
        if (phoneMatch) session.phone = phoneMatch[0];
      }

      if (
        session.income == null &&
        (msg.includes("income") || msg.includes("salary"))
      ) {
        const value = extractNumber(msg);
        if (value) {
          session.income = msg.includes("annual")
            ? Math.floor(value / 12)
            : value;
        }
      }

      if (
        session.loan_amount == null &&
        (msg.includes("loan") || msg.includes("amount"))
      ) {
        const amount = extractNumber(msg);
        if (amount) session.loan_amount = amount;
      }

      // ✅ inquiry → documents (ONLY ONCE)
      if (
        session.name &&
        session.phone &&
        session.income != null &&
        session.loan_amount != null
      ) {
        session.stage = "documents";
      }
    }

    await session.save();

    // --------------------
    // 3️⃣ After document upload → KYC verified
    // --------------------
    if (
      session.stage === "documents" &&
      session.documents_uploaded === true &&
      session.kyc_status === "verified"
    ) {
      session.stage = "sanction_ready";
      await session.save();
    }

    // --------------------
    // 4️⃣ Orchestrator + agents
    // --------------------
    const orchestration = decideNextActions(session);
    const agentResults = runAgents(session, orchestration.actions);

    let goal = orchestration.goal;
    let next_action = null;

    // --------------------
    // 5️⃣ UI control (UPLOAD ONLY IN DOCUMENTS)
    // --------------------
    if (session.stage === "documents") {
      next_action = "upload_docs";
      goal = "COLLECT_DOCUMENTS";
    }

    // --------------------
    // 6️⃣ Generate sanction letter
    // --------------------
    if (
      session.stage === "sanction_ready" &&
      msg.includes("ok")
    ) {
      session.sanction_letter_url =
        "https://demo-bank.com/sanction-letter.pdf";
      session.stage = "completed";
      goal = "COMPLETE_FLOW";
      await session.save();
    }

    // --------------------
    // 7️⃣ Narration
    // --------------------
    const aiResponse = await narrateConversation({
      session,
      goal,
      agentResults,
      isFirstInteraction,
      isTerminal: session.stage === "completed",
    });

    // --------------------
    // 8️⃣ Response
    // --------------------
    res.status(200).json({
      session_id: session.session_id,
      stage: session.stage,
      goal,
      next_action,
      sanction_letter_url: session.sanction_letter_url || null,
      ai_message: aiResponse,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
