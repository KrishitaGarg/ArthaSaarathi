export async function POST(request) {
  const { message } = await request.json();
  const text = message.toLowerCase();

  let botResponse = "";
  let next_action = null;

  if (text.includes("income\\amount") || text.match(/\d{5,}/)) {
    botResponse =
      "Got it. Now please upload your PAN or latest salary slip so I can check your eligibility.";
    next_action = "upload_pan";
  } else if (text.includes("pan") || text.includes("salary")) {
    botResponse =
      "You can upload your PAN / salary slip using the upload option below.";
    next_action = "upload_pan";
  } else {
    botResponse =
      "Tell me your monthly income or the loan amount you’re looking for.";
  }

  await new Promise((r) => setTimeout(r, 800));

  return Response.json({
    bot_response: botResponse,
    next_action,
  });
}
