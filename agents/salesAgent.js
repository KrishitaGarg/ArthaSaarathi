// agents/salesAgent.js

function salesAgent(session) {
  const missing = [];

  // ✅ Check ALL fields (not else-if)
  if (!session.name) missing.push("name");
  if (!session.phone) missing.push("phone");
  if (!session.income) missing.push("income");
  if (!session.loan_amount) missing.push("loan_amount");

  // 🔑 HARD STOP: basic info complete → force document upload
  if (missing.length === 0 && !session.kyc_status) {
    return {
      agent: "sales",
      goal: "COLLECT_DOCUMENTS",
      status: "pending",
      facts: {},
      missing_fields: ["documents"],
      suggested_next_action: "upload_docs",
      ai_message:
        "Great! I have your basic details. Please upload your PAN card and latest salary slip to continue.",
      updates: {
        stage: "documents",
      },
    };
  }

  // 🔁 Still collecting basics
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

module.exports = salesAgent;
