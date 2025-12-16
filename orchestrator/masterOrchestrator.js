const salesAgent = require("../agents/salesAgent");
const verificationAgent = require("../agents/verificationAgent");
const underwritingAgent = require("../agents/underwritingAgent");
const sanctionAgent = require("../agents/sanctionAgent");

function decideNextActions(session) {
  const actions = [];
  let goal = null;

  // 1️⃣ Collect basic info (STRICT)
  if (!session.income || !session.loan_amount || !session.phone) {
    goal = "COLLECT_BASIC_INFO";
  }

  // 2️⃣ HARD-CODED DOCUMENT UPLOAD STAGE (DEMO SAFE)
  else if (session.stage === "documents") {
    goal = "REQUEST_DOCUMENT_UPLOAD";
  }

  // 3️⃣ HARD-CODED OFFER STAGE (after docs)
  else if (session.stage === "offers") {
    goal = "SHOW_OFFERS";
  }

  // 4️⃣ Generate sanction after offer selected
  else if (session.stage === "sanction") {
    goal = "GENERATE_SANCTION";
  }

  // 5️⃣ Done
  else {
    goal = "COMPLETE_FLOW";
  }

  switch (goal) {
    case "COLLECT_BASIC_INFO":
      actions.push({
        agent: "sales",
        reason: "Missing basic user information",
        missing_fields: getMissingFields(session),
      });
      break;

    case "REQUEST_DOCUMENT_UPLOAD":
      actions.push({
        agent: "none",
        reason: "Show document upload UI to user",
      });
      break;

    case "SHOW_OFFERS":
      actions.push({
        agent: "none",
        reason: "Show loan offers for selection",
      });
      break;

    case "GENERATE_SANCTION":
      actions.push({
        agent: "sanction",
        reason: "Generate sanction letter for selected offer",
      });
      break;

    case "COMPLETE_FLOW":
      actions.push({
        agent: "none",
        reason: "All steps completed",
      });
      break;
  }

  return { goal, actions };
}

function runAgents(session, actions) {
  const results = [];

  for (const action of actions) {
    let result = null;

    switch (action.agent) {
      case "sales":
        result = salesAgent(session);
        break;

      case "verification":
        result = verificationAgent(session);
        break;

      case "underwriting":
        result = underwritingAgent(session);
        break;

      case "sanction":
        result = sanctionAgent(session);
        break;

      default:
        continue;
    }

    if (result) results.push(result);
  }

  return results;
}

function getMissingFields(session) {
  const missing = [];

  if (!session.phone) missing.push("phone");
  if (!session.income) missing.push("income");
  if (!session.loan_amount) missing.push("loan_amount");

  return missing;
}

module.exports = {
  decideNextActions,
  runAgents,
};
