const express = require("express");
const router = express.Router();

const Session = require("../models/session");
const {
  decideNextActions,
  runAgents,
} = require("../orchestrator/masterOrchestrator");
const narrateConversation = require("../llm/narrator");

// --------------------
// Utility
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
    // 1️ Load or create session
    // --------------------
    let session;

    if (session_id) {
      session = await Session.findOne({ session_id });
    }

    if (!session) {
      session = await Session.create({
        session_id: session_id || `sess_${Date.now()}`,
        stage: "inquiry",
      });
    }

    const msg = message.toLowerCase();

    // --------------------
    // 2️ Intent & data extraction
    // (Allowed only before KYC is finalized)
    // --------------------
    if (session.kyc_status !== "verified") {
      if (msg.includes("income")) {
        const income = extractNumber(msg);
        if (income) session.income = income;
      }

      if (msg.includes("loan") || msg.includes("amount")) {
        const amount = extractNumber(msg);
        if (amount) session.loan_amount = amount;
      }
    }

    const phoneMatch = msg.match(/\b\d{10}\b/);
    if (phoneMatch) {
      session.phone = phoneMatch[0];
    }

    if (msg.startsWith("my name is")) {
      session.name = message.replace(/my name is/i, "").trim();
    }

    await session.save();

    // --------------------
    // 3️ Orchestrator plans (THINK)
    // --------------------
    const orchestration = decideNextActions(session);

    // --------------------
    // 4️ Agents execute (ACT)
    // --------------------
    const agentResults = runAgents(session, orchestration.actions);

    // Apply agent updates
    agentResults.forEach((result) => {
      if (result.updates) {
        Object.assign(session, result.updates);
      }
    });

    await session.save();

    // --------------------
    // 5️ LLM narration (SPEAK)
    // --------------------
    const aiResponse = await narrateConversation({
      session,
      goal: orchestration.goal,
      agentResults,
    });

    // --------------------
    // 6️ Final response
    // --------------------
    res.status(200).json({
      session_id: session.session_id,
      stage: session.stage,
      goal: orchestration.goal,
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
