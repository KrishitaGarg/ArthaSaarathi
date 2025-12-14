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
        stage: "COLLECT_NAME",
      });
    }

    // 🔒 HARD STOP — conversation already completed
    if (session.sanction_letter_url) {
      return res.status(200).json({
        session_id: session.session_id,
        stage: session.stage,
        goal: "COMPLETE_FLOW",
        ai_message:
          "Your loan has already been sanctioned. The sanction letter is available. Thank you for choosing ArthaSaarthi.",
      });
    }

    const msg = message.toLowerCase().trim();

    // --------------------
    // 2️⃣ SAFE NAME CAPTURE (ONLY at correct stage)
    // --------------------
    if (!session.name && session.stage === "COLLECT_NAME") {
      if (msg.startsWith("my name is")) {
        session.name = message.replace(/my name is/i, "").trim();
      } else if (isLikelyName(message)) {
        session.name = message.trim();
      }
    }

    // --------------------
    // 3️⃣ HANDLE USER RESPONSE BASED ON EXPECTED FIELD
    // --------------------
    if (session.expected_field) {
      const value = extractNumber(msg);

      // PHONE
      if (session.expected_field === "phone") {
        if (/^\d{10}$/.test(msg)) {
          session.phone = msg;
          session.expected_field = null;
        }
      }

      // INCOME
      if (
        session.expected_field === "income" &&
        value &&
        !session.income
      ) {
        session.income = value;
        session.expected_field = null;
      }

      // LOAN AMOUNT
      if (
        session.expected_field === "loan_amount" &&
        value &&
        !session.loan_amount
      ) {
        session.loan_amount = value;
        session.expected_field = null;
      }
    }

    await session.save();

    // --------------------
    // 4️⃣ Orchestrator decides (THINK)
    // --------------------
    const orchestration = decideNextActions(session);

    // --------------------
    // 5️⃣ Agents execute (ACT)
    // --------------------
    const agentResults = runAgents(session, orchestration.actions);

    agentResults.forEach((result) => {
      if (result.updates) {
        Object.assign(session, result.updates);
      }

      // 🔑 Capture what Sales Agent wants next
      if (result.agent === "sales" && result.missing_fields?.length > 0) {
        session.expected_field = result.missing_fields[0];
      }
    });

    // --------------------
    // 🔁 FIX: SYNC stage with expected_field (CRITICAL)
    // --------------------
    if (session.expected_field === "name") {
      session.stage = "COLLECT_NAME";
    }
    if (session.expected_field === "phone") {
      session.stage = "COLLECT_PHONE";
    }
    if (session.expected_field === "income") {
      session.stage = "COLLECT_INCOME";
    }
    if (session.expected_field === "loan_amount") {
      session.stage = "COLLECT_LOAN_AMOUNT";
    }

    // --------------------
    // 6️⃣ Terminal state detection
    // --------------------
    const isTerminal =
      orchestration.goal === "COMPLETE_FLOW" ||
      Boolean(session.sanction_letter_url);

    if (isTerminal) {
      session.stage = "SANCTIONED";
    }

    await session.save();

    // --------------------
    // 7️⃣ LLM Narration (SPEAK)
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
      aiResponse = isTerminal
        ? "Your loan has been successfully sanctioned. The sanction letter is ready. Thank you for choosing ArthaSaarthi."
        : "Thank you. Please continue with the next step.";
    }

    // --------------------
    // 8️⃣ Final response
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
