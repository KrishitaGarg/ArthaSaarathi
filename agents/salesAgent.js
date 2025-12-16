// agents/salesAgent.js

function salesAgent(session) {
  const missing = [];

  // 🔒 ABSOLUTE STOP: never collect sales info after basic info is complete
  if (
    session.stage === "basic_info_complete" ||
    session.stage === "documents" ||
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

  // 🔁 Still collecting basic info
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

  // 🔒 Basic info just completed → handoff
  return {
    agent: "sales",
    goal: "COLLECT_DOCUMENTS",
    status: "pending",
    facts: {},
    missing_fields: ["pan", "salary"],
    suggested_next_action: "upload_docs",
    ai_message:
      "Great! I have your basic details. Please upload your PAN card and latest salary slip to continue.",
    updates: {
      stage: "basic_info_complete",
    },
  };
}

module.exports = salesAgent;
