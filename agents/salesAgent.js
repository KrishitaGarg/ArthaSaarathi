// agents/salesAgent.js

function salesAgent(session) {
  const missing = [];

  // 🔒 ABSOLUTE STOP: never collect sales info after documents stage
  if (
    session.stage === "documents" ||
    session.stage === "kyc_verification" ||
    session.stage === "kyc_verified" ||
    session.stage === "offers" ||
    session.stage === "sanction_ready" ||
    session.stage === "completed"
  ) {
    return {
      agent: "sales",
      goal: "WAIT",
      status: "complete",
      facts: {},
      missing_fields: [],
      suggested_next_action: null,
      ai_message: null,
      updates: {},
    };
  }

  // ✅ Collect basic info ONLY in inquiry stage
  if (!session.name) missing.push("name");
  else if (!session.phone) missing.push("phone");
  else if (session.income == null) missing.push("income");
  else if (session.loan_amount == null) missing.push("loan_amount");

  if (missing.length > 0) {
    return {
      agent: "sales",
      goal: "COLLECT_BASIC_INFO",
      status: "pending",
      facts: {},
      missing_fields: missing,
      suggested_next_action: `ask_${missing[0]}`,
      ai_message: `Please provide your ${missing[0]}.`,
      updates: {},
    };
  }

  // ✅ Trigger document upload ONCE
  return {
    agent: "sales",
    goal: "COLLECT_DOCUMENTS",
    status: "pending",
    facts: {},
    missing_fields: ["pan", "salary"],
    suggested_next_action: "upload_docs",
    ai_message:
      "Great! I have your basic details. Please upload your PAN card and latest salary slip to continue.",
    updates: {},
  };
}

module.exports = salesAgent;
