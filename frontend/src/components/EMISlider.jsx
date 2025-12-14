"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function EMISlider({ loanAmount = 500000, onChange }) {
  const [tenure, setTenure] = useState(24);
  const [emi, setEmi] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchEmi = async (amount, months) => {
    if (!API_BASE) return;
    try {
      setLoading(true);
      const res = await fetch(
        `${API_BASE}/api/loan/emi?amount=${amount}&tenure=${months}`
      );
      const data = await res.json();
      if (data.monthly_emi) {
        setEmi(data.monthly_emi);
        onChange && onChange(data.monthly_emi, months, data);
      }
    } catch (e) {
      // fallback: keep previous EMI or 0
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmi(loanAmount, tenure);
  }, [loanAmount, tenure]);

  const affordability =
    emi < 20000 ? "Comfortable" : emi < 40000 ? "Manageable" : "High";

  return (
    <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-blue-50 text-xs">
      <div className="flex justify-between items-center mb-2">
        <span className="font-medium">Estimated EMI</span>
        <span className="text-lg font-bold text-slate-800">
          {loading ? "…" : `₹${emi.toLocaleString()}`}
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

      {!loading && (
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
      )}
    </div>
  );
}
