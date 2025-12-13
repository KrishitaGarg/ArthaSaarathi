function isValidPAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  }
  
  function evaluateKYC({ pan, salary }) {
    let kyc_status = "verified";
    let risk_score = 0;
    let reason = "PAN and salary validated successfully";
  
    if (!isValidPAN(pan)) {
      kyc_status = "rejected";
      risk_score = 90;
      reason = "Invalid PAN format";
    } else if (salary < 5000) {
      kyc_status = "rejected";
      risk_score = 80;
      reason = "Salary below minimum threshold";
    }
  
    return {
      kyc_status,
      risk_score,
      reason,
    };
  }
  
  module.exports = {
    evaluateKYC,
  };
  