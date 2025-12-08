"use client";

const STAGES = ["Welcome", "Details", "Documents", "Eligibility", "Offer"];

export default function ProgressBar({ stageIndex = 0 }) {
  const total = STAGES.length;
  const clamped = Math.min(Math.max(stageIndex, 0), total - 1);
  const progress = ((clamped + 1) / total) * 100;

  return (
    <div className="mb-3">
      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>
          Step {clamped + 1}/{total}
        </span>
        <span>{STAGES[clamped]}</span>
      </div>
    </div>
  );
}
