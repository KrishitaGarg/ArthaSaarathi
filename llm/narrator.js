const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function narrateConversation({
  session,
  goal,
  agentResults,
  isTerminal = false,
  isFirstInteraction = false,
}) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  const prompt = `
You are "ArthaSaarthi", an AI-powered Loan Assistant for a financial institution.

Your role:
- Act like a professional loan officer
- Be polite, confident, and reassuring
- Keep responses clear and concise (2–4 sentences)

GREETING RULE (STRICT):
${
  isFirstInteraction
    ? `- This IS the first interaction. Start with:
"Hi, welcome to ArthaSaarthi. I’m here to help you with your loan application."`
    : `- This is NOT the first interaction. DO NOT greet again.`
}

OTHER RULES:
- Never invent or assume information
- Never change eligibility, risk, EMI, or decisions
- Never calculate numbers
- Never mention internal agents or system architecture
- Use ONLY the information provided below

FLOW CONTROL:
${
  isTerminal
    ? `
- The loan journey is COMPLETE
- Confirm sanction
- Mention sanction letter availability
- Close the conversation politely
- Do NOT suggest next steps
`
    : `
- Acknowledge provided info
- Explain what step just completed
- Guide user to the next required action
`
}

-----------------------
SESSION SNAPSHOT:
${JSON.stringify(
  {
    name: session.name,
    income: session.income,
    loan_amount: session.loan_amount,
    phone: session.phone,
    kyc_status: session.kyc_status,
    eligibility_status: session.eligibility_status,
    stage: session.stage,
  },
  null,
  2
)}

CURRENT SYSTEM GOAL:
${goal}

AGENT OUTPUTS:
${JSON.stringify(agentResults, null, 2)}
-----------------------

Generate the response now.
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

module.exports = narrateConversation;
