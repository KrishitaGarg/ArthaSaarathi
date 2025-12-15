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

  // 2️⃣ Ask for document upload if KYC not done yet
  else if (!session.kyc_status) {
    goal = "REQUEST_DOCUMENT_UPLOAD";
  }

  // 3️⃣ Verify KYC after documents are uploaded
  else if (
    session.stage === "kyc_verification" &&
    session.kyc_status !== "verified"
  ) {
    goal = "VERIFY_KYC";
  }

  // 4️⃣ Assess eligibility only AFTER KYC is verified
  else if (
    session.kyc_status === "verified" &&
    session.eligibility_status !== "approved" &&
    session.underwriting_retry !== true
  ) {
    goal = "ASSESS_ELIGIBILITY";
  }

  // 5️⃣ Generate sanction
  else if (
    session.eligibility_status === "approved" &&
    !session.sanction_letter_url
  ) {
    goal = "GENERATE_SANCTION";
  }

  // 6️⃣ Done
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
        reason: "Awaiting PAN and salary document upload",
      });
      break;

    case "VERIFY_KYC":
      actions.push({
        agent: "verification",
        reason: "Documents uploaded, verify KYC",
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
