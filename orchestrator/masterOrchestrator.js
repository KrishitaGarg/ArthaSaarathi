const salesAgent = require("../agents/salesAgent");
const verificationAgent = require("../agents/verificationAgent");
const underwritingAgent = require("../agents/underwritingAgent");
const sanctionAgent = require("../agents/sanctionAgent");

function decideNextActions(session) {
  const actions = [];
  let goal = null;

  // 🔒 STAGE-DRIVEN FLOW (NO FIELD CHECKS OUTSIDE INQUIRY)

  // 1️⃣ Inquiry → collect basic info
  if (session.stage === "inquiry") {
    goal = "COLLECT_BASIC_INFO";
  }

  // 2️⃣ After basic info → wait for documents
  else if (session.stage === "documents") {
    goal = "WAIT_FOR_DOCUMENTS";
  }

  // 3️⃣ Offers stage
  else if (session.stage === "offers") {
    goal = "SHOW_OFFERS";
  }

  // 4️⃣ Sanction generation
  else if (session.stage === "sanction" || session.stage === "sanction_ready") {
    goal = "GENERATE_SANCTION";
  }

  // 5️⃣ Completed
  else {
    goal = "COMPLETE_FLOW";
  }

  switch (goal) {
    case "COLLECT_BASIC_INFO":
      actions.push({
        agent: "sales",
        reason: "Collecting basic user information",
        missing_fields: getMissingFields(session),
      });
      break;

    case "WAIT_FOR_DOCUMENTS":
      actions.push({
        agent: "none",
        reason: "Waiting for user to upload documents",
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

// ⚠️ Used ONLY during inquiry
function getMissingFields(session) {
  const missing = [];

  if (!session.name) missing.push("name");
  if (!session.phone) missing.push("phone");
  if (session.income == null) missing.push("income");
  if (session.loan_amount == null) missing.push("loan_amount");

  return missing;
}

module.exports = {
  decideNextActions,
  runAgents,
};
