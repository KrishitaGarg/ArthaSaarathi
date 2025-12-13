// agents/sanctionAgent.js

const { generateSanctionPDF } = require("../tools/pdf");

function sanctionAgent(session) {
  // Safety check
  if (!session.offers || session.offers.length === 0) {
    return null;
  }

  // For demo: select first approved offer
  const selectedOffer = session.offers[0];

  // Generate real PDF
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
