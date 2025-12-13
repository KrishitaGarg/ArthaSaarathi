// agents/salesAgent.js

function salesAgent(session) {
    const missing = [];
  
    if (!session.name) missing.push("name");
    if (!session.phone) missing.push("phone");
    if (!session.income) missing.push("income");
    if (!session.loan_amount) missing.push("loan_amount");
  
    return {
      agent: "sales",
      goal: "collect_missing_info",
      status: missing.length === 0 ? "complete" : "pending",
      facts: {},
      missing_fields: missing,
      suggested_next_action: missing[0]
        ? `ask_${missing[0]}`
        : "handoff_to_verification",
      updates: {},
    };
  }
  
  module.exports = salesAgent;
  