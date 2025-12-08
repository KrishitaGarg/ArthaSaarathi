export async function POST(request) {
  const { message, session_id } = await request.json();
  const text = (message || "").toLowerCase();

  let bot_response = "";
  let next_action = null;
  let confidence_score = 0.9;

  if (text.includes("loan") || text.includes("amount")) {
    bot_response =
      "Great, what loan amount and approximate tenure are you looking for?";
  } else if (text.includes("income") || text.match(/\d{5,}/)) {
    bot_response =
      "Got it. Now please upload your PAN or latest salary slip so I can check your eligibility.";
    next_action = "upload_docs";
  } else if (text.includes("pan") || text.includes("salary")) {
    bot_response =
      "You can upload your PAN / salary slip using the upload option below.";
    next_action = "upload_docs";
  } else {
    bot_response =
      "Tell me your monthly income or the loan amount you’re looking for.";
  }

  await new Promise((r) => setTimeout(r, 800));

  return Response.json({
    bot_response,
    confidence_score,
    next_action,
    session_id: session_id || null,
  });
}
