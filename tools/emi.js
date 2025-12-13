function calculateEMI({ principal, annualRate, tenureMonths }) {
    const monthlyRate = annualRate / 12 / 100;
  
    if (monthlyRate === 0) {
      return Math.round(principal / tenureMonths);
    }
  
    const emi =
      (principal *
        monthlyRate *
        Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
    return Math.round(emi);
  }
  
  module.exports = { calculateEMI };
  