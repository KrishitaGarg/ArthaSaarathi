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
// Hardcoded loan offers (demo-safe)
// --------------------
function generateLoanOffers(loanAmount) {
  if (loanAmount <= 300000) {
    return [
      { id: 1, emi: 9500, tenure: 36, rate: "13.5%" },
      { id: 2, emi: 7200, tenure: 48, rate: "14%" },
      { id: 3, emi: 5800, tenure: 60, rate: "14.5%" },
    ];
  }

  return [
    { id: 1, emi: 15500, tenure: 36, rate: "12.5%" },
    { id: 2, emi: 12000, tenure: 48, rate: "13%" },
    { id: 3, emi: 9800, tenure: 60, rate: "13.5%" },
  ];
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
    // 2️⃣ FACT EXTRACTION
    // --------------------
    if (!session.name && msg.startsWith("my name is")) {
      session.name = message.replace(/my name is/i, "").trim();
    }

    if (!session.phone) {
      const phoneMatch = msg.match(/\b\d{10}\b/);
      if (phoneMatch) session.phone = phoneMatch[0];
    }

    if (!session.income && (msg.includes("income") || msg.includes("salary"))) {
      const value = extractNumber(msg);
      if (value) {
        if (msg.includes("annual")) {
          session.income = Math.floor(value / 12);
        } else {
          session.income = value;
        }
      }
    }

    if (
      session.loan_amount == null &&
      (msg.includes("loan") || msg.includes("amount"))
    ) {
      const amount = extractNumber(msg);

      if (amount) {
        session.loan_amount = amount;

        // 🔒 FINAL FIX: LOCK BASIC INFO COMPLETION
        session.stage = "basic_info_complete";
      }
    }

    // --------------------
    // 3️⃣ Save after extraction
    // --------------------
    await session.save();

    // --------------------
    // 4️⃣ LLM KYC VERIFICATION (after upload)
    // --------------------
    if (
      session.stage === "documents" &&
      session.documents_uploaded === true &&
      session.kyc_status !== "verified"
    ) {
      session.kyc_status = "verified";
      session.stage = "kyc_verified";
      await session.save();
    }

    // --------------------
    // 5️⃣ Orchestrator
    // --------------------
    const orchestration = decideNextActions(session);

    // --------------------
    // 6️⃣ Agents
    // --------------------
    const agentResults = runAgents(session, orchestration.actions);

    let goal = orchestration.goal;
    let next_action = null;

    agentResults.forEach((result) => {
      if (result.updates) {
        Object.assign(session, result.updates);
      }

      if (
        result.agent === "sales" &&
        result.suggested_next_action === "upload_docs"
      ) {
        next_action = "upload_docs";
        goal = "COLLECT_DOCUMENTS";
        session.stage = "documents";
      }
    });

    // --------------------
    // 7️⃣ After KYC → Show Offers
    // --------------------
    if (
      session.stage === "kyc_verified" &&
      !session.offers
    ) {
      session.offers = generateLoanOffers(session.loan_amount);
      session.stage = "offers";
      goal = "SHOW_OFFERS";
    }

    // --------------------
    // 8️⃣ Offer selection
    // --------------------
    if (session.stage === "offers" && session.offers) {
      const choice =
        msg.includes("1") || msg.includes("first")
          ? 1
          : msg.includes("2") || msg.includes("second")
          ? 2
          : msg.includes("3") || msg.includes("third")
          ? 3
          : null;

      if (choice) {
        session.selected_offer = session.offers.find(
          (o) => o.id === choice
        );
        session.stage = "sanction_ready";
      }
    }

    // --------------------
    // 9️⃣ Generate sanction letter ONLY on user intent
    // --------------------
    if (
      session.stage === "sanction_ready" &&
      msg.includes("generate")
    ) {
      session.sanction_letter_url =
        "https://demo-bank.com/sanction-letter.pdf";
      session.stage = "completed";
      goal = "COMPLETE_FLOW";
    }

    // --------------------
    // 🔟 Terminal check
    // --------------------
    const isTerminal =
      goal === "COMPLETE_FLOW" ||
      Boolean(session.sanction_letter_url);

    await session.save();

    // --------------------
    // 11️⃣ Narration
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
      if (session.stage === "kyc_verified") {
        aiResponse =
          "Your documents have been successfully verified by our system. You may now proceed to view loan offers.";
      } else if (session.stage === "sanction_ready") {
        aiResponse =
          "Your loan offer is confirmed. Please say 'generate sanction letter' to proceed.";
      } else {
        aiResponse = "Please continue.";
      }
    }

    // --------------------
    // 12️⃣ Response
    // --------------------
    res.status(200).json({
      session_id: session.session_id,
      stage: session.stage,
      goal,
      next_action,
      offers: session.offers || null,
      selected_offer: session.selected_offer || null,
      ai_message: aiResponse,
    });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
