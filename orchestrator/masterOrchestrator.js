const salesAgent = require("../agents/salesAgent");
const verificationAgent = require("../agents/verificationAgent");
const underwritingAgent = require("../agents/underwritingAgent");
const sanctionAgent = require("../agents/sanctionAgent");

function decideNextActions(session) {
  const actions = [];
  let goal = null;

  // 1️⃣ Collect basic info
  if (!session.income || !session.loan_amount || !session.phone) {
    goal = "COLLECT_BASIC_INFO";
  }

  // 2️⃣ Assess eligibility AFTER KYC verified
  else if (
    session.kyc_status === "verified" &&
    !session.sanction_letter_url &&
    (!session.eligibility_status || session.eligibility_status !== "approved") &&
    !session.underwriting_retry
  ) {
    goal = "ASSESS_ELIGIBILITY";
  }

  // 3️⃣ Generate sanction if offer / approval exists
  else if (
    (session.eligibility_status === "approved" ||
      (session.offers && session.offers.length > 0)) &&
    !session.sanction_letter_url
  ) {
    goal = "GENERATE_SANCTION";
  }

  // 4️⃣ Done
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

    case "ASSESS_ELIGIBILITY":
      actions.push({
        agent: "underwriting",
        reason: "KYC verified, assess eligibility",
      });
      break;

    case "GENERATE_SANCTION":
      actions.push({
        agent: "sanction",
        reason: "Eligibility approved, generate sanction",
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

  if (!session.income) missing.push("income");
  if (!session.loan_amount) missing.push("loan_amount");
  if (!session.phone) missing.push("phone");

  return missing;
}

module.exports = {
  decideNextActions,
  runAgents,
};
