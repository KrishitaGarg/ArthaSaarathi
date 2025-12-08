"use client";

import { useEffect, useState } from "react";

export default function EMISlider({ loanAmount = 500000, onChange }) {
  const [tenure, setTenure] = useState(24);
  const [emi, setEmi] = useState(0);

  const calcEMI = (principal, months) => {
    const rate = 0.12 / 12; // 12% yearly → monthly (0.01)
    const emiVal =
      (principal * rate * Math.pow(1 + rate, months)) /
      (Math.pow(1 + rate, months) - 1);
    return Math.round(emiVal);
  };

  useEffect(() => {
    const e = calcEMI(loanAmount, tenure);
    setEmi(e);
    onChange && onChange(e, tenure);
  }, [loanAmount, tenure, onChange]);

  const affordability =
    emi < 20000 ? "Comfortable" : emi < 40000 ? "Manageable" : "High";

  return (
    <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">Estimated EMI</span>
        <span className="text-lg font-bold text-slate-800">
          ₹{emi.toLocaleString()}
        </span>
      </div>

      <input
        type="range"
        min="12"
        max="60"
        value={tenure}
        onChange={(e) => setTenure(Number(e.target.value))}
        className="w-full accent-blue-600"
      />

      <div className="flex justify-between text-[11px] text-slate-500 mt-1">
        <span>12 months</span>
        <span>{tenure} months</span>
        <span>60 months</span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            affordability === "Comfortable"
              ? "bg-emerald-500"
              : affordability === "Manageable"
              ? "bg-amber-500"
              : "bg-red-500"
          }`}
        />
        <span className="text-[11px] text-slate-700">
          {affordability} for ₹{emi.toLocaleString()} per month
        </span>
      </div>
    </div>
  );
}
