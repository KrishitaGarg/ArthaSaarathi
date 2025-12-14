function decideNextActions(session) {
  const actions = [];
  let goal = null;

  // 1️⃣ Collect basic info
  if (!session.income || !session.loan_amount || !session.phone) {
    goal = "COLLECT_BASIC_INFO";
  }

  // 2️⃣ Request document upload (NEW & REQUIRED)
  else if (
    session.income &&
    session.loan_amount &&
    session.phone &&
    !session.kyc_status
  ) {
    goal = "REQUEST_DOCUMENT_UPLOAD";
    session.stage = "document_upload";
  }

  // 3️⃣ Verify KYC AFTER documents are uploaded
  else if (
    session.stage === "kyc_verification" &&
    session.kyc_status !== "verified"
  ) {
    goal = "VERIFY_KYC";
  }

  // 4️⃣ Underwriting
  else if (
    session.kyc_status === "verified" &&
    session.eligibility_status !== "approved" &&
    session.underwriting_retry !== true
  ) {
    goal = "ASSESS_ELIGIBILITY";
  }

  // 5️⃣ Sanction
  else if (
    session.eligibility_status === "approved" &&
    !session.sanction_letter_url
  ) {
    goal = "GENERATE_SANCTION";
  }

  // 6️⃣ Done
  else {
    goal = "COMPLETE_FLOW";
  }

  // -------------------------
  // ACTIONS
  // -------------------------
  switch (goal) {
    case "COLLECT_BASIC_INFO":
      actions.push({
        agent: "sales",
        reason: "Missing basic user information",
        missing_fields: getMissingFields(session),
      });
      break;

    case "REQUEST_DOCUMENT_UPLOAD":
      actions.push({
        agent: "none",
        reason: "Awaiting PAN and salary document upload for KYC",
      });
      break;

    case "VERIFY_KYC":
      actions.push({
        agent: "verification",
        reason: "Factual KYC completed, decision required",
      });
      break;

    case "ASSESS_ELIGIBILITY":
      actions.push({
        agent: "underwriting",
        reason: "KYC verified, assess eligibility",
      });
      break;

    case "GENERATE_SANCTION":
      actions.push({
        agent: "sanction",
        reason: "Eligibility approved, generate sanction",
      });
      break;

    case "COMPLETE_FLOW":
      actions.push({
        agent: "none",
        reason: "All steps completed",
      });
      break;
  }

  return { goal, actions };
}
