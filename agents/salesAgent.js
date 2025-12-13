// agents/salesAgent.js

function salesAgent(session) {
  if (!session.name) {
    return {
      agent: "sales",
      goal: "collect_basic_info",
      status: "pending",
      facts: {},
      missing_fields: ["name"],
      suggested_next_action: "ask_name",
      updates: {
        expected_field: "name",
      },
    };
  }

  if (!session.phone) {
    return {
      agent: "sales",
      goal: "collect_basic_info",
      status: "pending",
      facts: {},
      missing_fields: ["phone"],
      suggested_next_action: "ask_phone",
      updates: {
        expected_field: "phone",
      },
    };
  }

  if (!session.income) {
    return {
      agent: "sales",
      goal: "collect_basic_info",
      status: "pending",
      facts: {},
      missing_fields: ["income"],
      suggested_next_action: "ask_income",
      updates: {
        expected_field: "income",
      },
    };
  }

  if (!session.loan_amount) {
    return {
      agent: "sales",
      goal: "collect_basic_info",
      status: "pending",
      facts: {},
      missing_fields: ["loan_amount"],
      suggested_next_action: "ask_loan_amount",
      updates: {
        expected_field: "loan_amount",
      },
    };
  }

  // All info collected
  return {
    agent: "sales",
    goal: "collect_basic_info",
    status: "complete",
    facts: {},
    missing_fields: [],
    suggested_next_action: "handoff_to_verification",
    updates: {
      expected_field: null,
    },
  };
}

module.exports = salesAgent;
