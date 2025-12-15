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
    let session = null;

    if (session_id) {
      session = await Session.findOne({ session_id });
    }

    const isFirstInteraction = !session;

    if (!session) {
      session = await Session.create({
        session_id: session_id || `sess_${Date.now()}`,
        stage: "inquiry",
      });
    }

    const msg = message.toLowerCase();

    // --------------------
    // 2️⃣ SIMPLE FACT EXTRACTION
    // --------------------

    if (!session.name && msg.startsWith("my name is")) {
      session.name = message.replace(/my name is/i, "").trim();
    }

    if (!session.phone) {
      const phoneMatch = msg.match(/\b\d{10}\b/);
      if (phoneMatch) session.phone = phoneMatch[0];
    }

    if (!session.income && (msg.includes("income") || msg.includes("salary"))) {
      const income = extractNumber(msg);
      if (income) session.income = income;
    }

    if (
      !session.loan_amount &&
      (msg.includes("loan") || msg.includes("amount"))
    ) {
      const amount = extractNumber(msg);
      if (amount) session.loan_amount = amount;
    }

    await session.save();

    // --------------------
    // 3️⃣ Orchestrator (THINK)
    // --------------------
    const orchestration = decideNextActions(session);

    // --------------------
    // 4️⃣ Agents (ACT)
    // --------------------
    const agentResults = runAgents(session, orchestration.actions);

    let next_action = null; // 🔑 ADD
    let goal = orchestration.goal; // 🔑 ADD

    agentResults.forEach((result) => {
      if (result.updates) {
        Object.assign(session, result.updates);
      }

      // 🔑 HARD MAP: sales → upload docs
      if (
        result.agent === "sales" &&
        result.suggested_next_action === "upload_docs"
      ) {
        next_action = "upload_docs";
        goal = "COLLECT_DOCUMENTS";
        session.stage = "documents";
      }
    });

    await session.save();

    // --------------------
    // 5️⃣ Terminal detection
    // --------------------
    const isTerminal =
      goal === "COMPLETE_FLOW" ||
      Boolean(session.sanction_letter_url);

    // --------------------
    // 6️⃣ Narration (SPEAK)
    // --------------------
    let aiResponse;
    try {
      aiResponse = await narrateConversation({
        session,
        goal,
        agentResults,
        isFirstInteraction,
        isTerminal,
      });
    } catch (err) {
      console.error("Narrator error:", err.message);
      aiResponse = isTerminal
        ? "Your loan has been successfully sanctioned. The sanction letter is ready. Thank you for choosing ArthaSaarthi."
        : "Now please upload your PAN card and latest salary slip to continue.";
    }

    // --------------------
    // 7️⃣ Response (🔑 FRONTEND SIGNAL)
    // --------------------
    res.status(200).json({
      session_id: session.session_id,
      stage: session.stage,
      goal,
      next_action, // 🔑 THIS UNBLOCKS FRONTEND
      agents_called: agentResults.map((r) => r.agent),
      agent_results: agentResults,
      ai_message: aiResponse,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
