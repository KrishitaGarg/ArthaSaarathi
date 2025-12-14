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
  return text.split(" ").length === 1 && /^[a-zA-Z]{2,}$/.test(text.trim());
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
        expected_field: "name",
      });
    }

    const msg = message.toLowerCase().trim();

    // --------------------
    // 2️⃣ Handle user input ONLY for expected_field
    // --------------------

    // NAME
    if (!session.name && session.expected_field === "name") {
      if (msg.startsWith("my name is")) {
        session.name = message.replace(/my name is/i, "").trim();
        session.expected_field = null;
      } else if (isLikelyName(message)) {
        session.name = message.trim();
        session.expected_field = null;
      }
    }

    // PHONE
    else if (session.expected_field === "phone") {
      if (/^\d{10}$/.test(msg)) {
        session.phone = msg;
        session.expected_field = null;
      }
    }

    // INCOME
    else if (session.expected_field === "income") {
      const value = extractNumber(msg);
      if (value && !session.income) {
        session.income = value;
        session.expected_field = null;
      }
    }

    // LOAN AMOUNT
    else if (session.expected_field === "loan_amount") {
      const value = extractNumber(msg);
      if (value && !session.loan_amount) {
        session.loan_amount = value;
        session.expected_field = null;
      }
    }

    await session.save();

    // --------------------
    // 🔁 FORCE NEXT EXPECTED FIELD (STRICT ORDER)
    // --------------------
    if (!session.expected_field) {
      if (!session.name) session.expected_field = "name";
      else if (!session.phone) session.expected_field = "phone";
      else if (!session.income) session.expected_field = "income";
      else if (!session.loan_amount) session.expected_field = "loan_amount";
      else session.expected_field = null;
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

    agentResults.forEach((result) => {
      if (result.updates) {
        Object.assign(session, result.updates);
      }
    });

    await session.save();

    // --------------------
    // 5️⃣ Terminal state (FINAL & CORRECT)
    // --------------------
    const isTerminal = orchestration.goal === "COMPLETE_FLOW";

    if (isTerminal) {
      session.stage = "sanction";
      await session.save();
    }

    // --------------------
    // 6️⃣ LLM Narration (SPEAK)
    // --------------------
    let aiResponse;
    try {
      aiResponse = await narrateConversation({
        session,
        goal: orchestration.goal,
        agentResults,
        isFirstInteraction,
        isTerminal,
      });
    } catch (err) {
      console.error("Narrator error:", err?.message || err);
      aiResponse = isTerminal
        ? "Your loan has been successfully sanctioned. The sanction letter is ready. Thank you for choosing ArthaSaarthi."
        : "Please continue with the next step.";
    }

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
