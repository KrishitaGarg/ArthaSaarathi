// agents/verificationAgent.js

function verificationAgent(session) {
  const { kyc_status, risk_score } = session;

  let decision = "request_additional_documents";
  let explanation = "KYC verification incomplete";

  if (kyc_status === "verified" && risk_score <= 30) {
    decision = "handoff_to_underwriting";
    explanation = "KYC verified with acceptable risk";
  } else if (kyc_status === "rejected" || risk_score > 70) {
    decision = "block_flow";
    explanation = "KYC rejected or risk too high";
  }

  return {
    agent: "verification",
    goal: "decision_kyc",
    decision,
    explanation,
    facts: {
      kyc_status,
      risk_score,
    },
    suggested_next_action: decision,
    updates: {
      stage:
        decision === "handoff_to_underwriting"
          ? "underwriting"
          : "kyc_verification",

      //
      eligibility_status:
        decision === "handoff_to_underwriting"
          ? "pending"
          : session.eligibility_status,
    },
  };
}

module.exports = verificationAgent;
