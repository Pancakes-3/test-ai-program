"use client";

import clsx from "clsx";

const tabs = [
  { id: "main", label: "Main" },
  { id: "following", label: "Following" },
  { id: "breaking", label: "Breaking News" },
  { id: "candidates", label: "Candidates" }
];

export type FeedTab = (typeof tabs)[number]["id"];

type FeedTabsProps = {
  value: FeedTab;
  onChange: (value: FeedTab) => void;
};

export function FeedTabs({ value, onChange }: FeedTabsProps) {
  return (
    <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-white p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={clsx(
            "rounded-full px-4 py-1.5 text-sm font-medium",
            value === tab.id
              ? "bg-brand-500 text-white"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
