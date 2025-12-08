export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const amount = Number(searchParams.get("amount") || 0);
  const tenure = Number(searchParams.get("tenure") || 0); // months

  if (!amount || !tenure) {
    return Response.json(
      { error: "amount and tenure are required" },
      { status: 400 }
    );
  }

  const rate = 0.12 / 12; // 12% annual → monthly
  const emi =
    (amount * rate * Math.pow(1 + rate, tenure)) /
    (Math.pow(1 + rate, tenure) - 1);
  const monthly_emi = Math.round(emi);
  const total_payment = monthly_emi * tenure;
  const total_interest = total_payment - amount;

  return Response.json({
    amount,
    tenure,
    monthly_emi,
    total_interest,
  });
}
