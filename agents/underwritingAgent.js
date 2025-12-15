const { calculateEMI } = require("../tools/emi");

function getInterestRate({ riskScore, tenure }) {
  let baseRate;

  if (riskScore <= 20) baseRate = 11.5;
  else if (riskScore <= 40) baseRate = 13.5;
  else if (riskScore <= 60) baseRate = 16.5;
  else baseRate = 20.0;

  if (tenure > 24) baseRate += 1.0;
  else if (tenure > 12) baseRate += 0.5;

  return baseRate;
}

function underwritingAgent(session) {
  const income = session.income;
  const requestedAmount = session.loan_amount;
  const riskScore = session.risk_score || 0;

  const maxEligibleAmount = income * 10;

  // ❌ Rejection with memory
  if (requestedAmount > maxEligibleAmount) {
    return {
      agent: "underwriting",
      goal: "assess_eligibility",
      status: "rejected",
      facts: {
        max_eligible_amount: maxEligibleAmount,
        requested_amount: requestedAmount,
      },
      suggested_next_action: "reduce_amount",
      updates: {
        eligibility_status: "rejected",
        underwriting_retry: true,
      },
    };
  }

  // ✅ Approval
  const approvedAmount = requestedAmount;
  const tenures = [12, 24, 36];

  const offers = tenures.map((tenure) => {
    const rate = getInterestRate({ riskScore, tenure });
    return {
      amount: approvedAmount,
      tenure,
      rate,
      emi: calculateEMI({
        principal: approvedAmount,
        annualRate: rate,
        tenureMonths: tenure,
      }),
    };
  });

  return {
    agent: "underwriting",
    goal: "assess_eligibility",
    status: "approved",
    facts: {
      max_eligible_amount: maxEligibleAmount,
      approved_amount: approvedAmount,
      risk_band:
        riskScore <= 20
          ? "LOW"
          : riskScore <= 40
          ? "LOW_MEDIUM"
          : riskScore <= 60
          ? "MEDIUM"
          : "HIGH",
    },
    missing_fields: [],
    suggested_next_action: "handoff_to_sanction",
    updates: {
      eligibility_status: "approved",
      underwriting_retry: false,
      stage: "offer_presented",
      offers,
    },
  };
}

module.exports = underwritingAgent;
