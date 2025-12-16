// agents/salesAgent.js

function salesAgent(session) {
  const missing = [];

  // ✅ Check ALL fields
  if (!session.name) missing.push("name");
  if (!session.phone) missing.push("phone");
  if (!session.income) missing.push("income");
  if (!session.loan_amount) missing.push("loan_amount");

  // 🔒 HARD STOP: basic info complete → move to documents ONLY ONCE
  if (
    missing.length === 0 &&
    session.stage !== "documents" &&
    session.stage !== "offers" &&
    session.stage !== "sanction"
  ) {
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

  // ✅ Safety fallback (should never hit)
  return {
    agent: "sales",
    goal: "WAIT",
    status: "complete",
    facts: {},
    missing_fields: [],
    suggested_next_action: null,
    ai_message: "Processing your application.",
    updates: {},
  };
}

module.exports = salesAgent;
