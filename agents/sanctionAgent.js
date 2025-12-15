// agents/sanctionAgent.js

const { generateSanctionPDF } = require("../tools/pdf");

function sanctionAgent(session) {
  // 🔑 SAFETY: ensure loan amount exists
  if (!session.loan_amount) {
    return null;
  }

  // 🔑 MVP: ensure at least one approved offer exists
  if (!session.offers || session.offers.length === 0) {
    session.offers = [
      {
        offer_id: `offer_${Date.now()}`,
        amount: session.loan_amount,
        tenure_months: 24,
        interest_rate: 10.5,
        status: "approved",
      },
    ];
  }

  // Select first approved offer
  const selectedOffer = session.offers.find(
    (offer) => offer.status === "approved"
  );

  if (!selectedOffer) {
    return null;
  }

  // Generate sanction PDF
  const sanctionUrl = generateSanctionPDF({
    session,
    offer: selectedOffer,
  });

  return {
    agent: "sanction",
    goal: "generate_sanction",
    status: "complete",
    facts: {
      sanction_letter_url: sanctionUrl,
    },
    missing_fields: [],
    suggested_next_action: "close_application",
    updates: {
      sanction_letter_url: sanctionUrl,
      stage: "sanction_generated",
    },
  };
}

module.exports = sanctionAgent;
