// agents/salesAgent.js

function salesAgent(session) {
  const missing = [];

  if (!session.name) missing.push("name");
  else if (!session.phone) missing.push("phone");
  else if (!session.income) missing.push("income");
  else if (!session.loan_amount) missing.push("loan_amount");
  else if (!session.kyc_status) missing.push("documents"); // 🔑 ADD THIS

  return {
    agent: "sales",
    goal: "collect_missing_info",
    status: missing.length === 0 ? "complete" : "pending",
    facts: {},
    missing_fields: missing,
    suggested_next_action: missing.length
      ? `ask_${missing[0]}`
      : "handoff_to_verification",
    updates: {},
  };
}

module.exports = salesAgent;
