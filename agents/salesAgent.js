// agents/salesAgent.js

function salesAgent(session) {
  const missing = [];

  if (!session.name) missing.push("name");
  else if (!session.phone) missing.push("phone");
  else if (!session.income) missing.push("income");
  else if (!session.loan_amount) missing.push("loan_amount");

  // 🔑 HARD STOP: basic info complete → force document upload
  if (missing.length === 0 && !session.kyc_status) {
    return {
      agent: "sales",
      goal: "COLLECT_DOCUMENTS",
      status: "pending",
      facts: {},
      missing_fields: ["documents"],
      suggested_next_action: "upload_docs",
      updates: {
        stage: "documents",
      },
    };
  }

  // 🔁 Still collecting basics
  return {
    agent: "sales",
    goal: "collect_missing_info",
    status: "pending",
    facts: {},
    missing_fields: missing,
    suggested_next_action: `ask_${missing[0]}`,
    updates: {},
  };
}

module.exports = salesAgent;
