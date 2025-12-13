const express = require("express");
const router = express.Router();

const Session = require("../models/session");
const {
  decideNextActions,
  runAgents,
} = require("../orchestrator/masterOrchestrator");
const narrateConversation = require("../llm/narrator");

// --------------------
// Utility helpers
// --------------------
function extractNumber(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function isLikelyName(text) {
  return (
    text.split(" ").length === 1 &&
    /^[a-zA-Z]{2,}$/.test(text.trim())
  );
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

    const msg = message.toLowerCase().trim();

    // --------------------
    // 2️⃣ Deterministic data extraction
    // --------------------

    // 🔹 Name extraction (HUMAN-LIKE, SAFE)
    if (!session.name) {
      if (msg.startsWith("my name is")) {
        session.name = message.replace(/my name is/i, "").trim();
      } else if (msg.startsWith("i said")) {
        session.name = message.replace(/i said/i, "").trim();
      } else if (isLikelyName(message)) {
        session.name = message.trim();
      }
    }

    // 🔹 Phone extraction (allowed anytime)
    const phoneMatch = msg.match(/\b\d{10}\b/);
    if (phoneMatch && !session.phone) {
      session.phone = phoneMatch[0];
    }

    // 🔹 Income & loan amount (lock after KYC)
    if (session.kyc_status !== "verified") {
      if (!session.income) {
        const income = extractNumber(msg);
        if (income && msg.includes("income")) {
          session.income = income;
        }
      }

      if (!session.loan_amount) {
        const amount = extractNumber(msg);
        if (amount && (msg.includes("loan") || msg.includes("amount"))) {
          session.loan_amount = amount;
        }
      }
    }

    await session.save();

    // --------------------
    // 3️⃣ Orchestrator decides (THINK)
    // --------------------
    const orchestration = decideNextActions(session);

    // --------------------
    // 4️⃣ Agents execute (ACT)
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
    // 5️⃣ Terminal state detection
    // --------------------
    const isTerminal =
      orchestration.goal === "COMPLETE_FLOW" ||
      session.sanction_letter_url;

    // --------------------
    // 6️⃣ LLM narration (SPEAK)
    // --------------------
    const aiResponse = await narrateConversation({
      session,
      goal: orchestration.goal,
      agentResults,
      isFirstInteraction,
      isTerminal,
    });

    // --------------------
    // 7️⃣ Final response
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
