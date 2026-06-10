import { useState } from "react";
import CardShell from "./CardShell";
import type { SignalItem } from "../types";

interface SignalBoardProps {
  loading: boolean;
  error: string | null;
  data: SignalItem[] | null;
  updatedAt?: string | null;
  onRetry?: () => void;
}

const levelEmphasis: Record<
  SignalItem["level"],
  {
    bar: string;
    cardBg: string;
    titleWeight: string;
    icon: string;
    badge: string;
  }
> = {
  red: {
    bar: "bg-[#ef4444]",
    cardBg: "bg-red-900/20",
    titleWeight: "font-bold",
    icon: "🔴",
    badge: "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]",
  },
  yellow: {
    bar: "bg-[#f59e0b]",
    cardBg: "bg-yellow-900/20",
    titleWeight: "font-normal",
    icon: "🟡",
    badge: "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]",
  },
  green: {
    bar: "bg-[#10b981]",
    cardBg: "bg-emerald-900/20",
    titleWeight: "font-normal",
    icon: "🟢",
    badge: "border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981]",
  },
  gray: {
    bar: "bg-slate-500",
    cardBg: "bg-slate-900/30",
    titleWeight: "font-normal",
    icon: "⚪",
    badge: "border-slate-500/40 bg-slate-500/10 text-slate-400",
  },
};

function SignalRow({ signal }: { signal: SignalItem }) {
  const [expanded, setExpanded] = useState(false);
  const emphasis = levelEmphasis[signal.level];

  return (
    <li>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={`group w-full overflow-hidden rounded-xl border border-slate-700/50 text-left shadow-lg transition-all duration-200 hover:border-slate-600 hover:shadow-xl ${emphasis.cardBg}`}
        aria-expanded={expanded}
      >
        <div className="flex">
          <span
            className={`w-1 shrink-0 transition-all duration-200 group-hover:w-1.5 ${emphasis.bar}`}
            aria-hidden
          />

          <div className="min-w-0 flex-1 px-3 py-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3
                className={`flex items-center gap-1.5 text-sm text-white ${emphasis.titleWeight}`}
              >
                <span aria-hidden>{emphasis.icon}</span>
                {signal.name}
              </h3>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${emphasis.badge}`}
              >
                {signal.levelLabel}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-300">
              {signal.summary}
            </p>

            <p className="mt-3 inline-flex rounded-md border border-[#10b981]/40 bg-[#10b981]/15 px-2.5 py-1 text-sm font-medium text-[#10b981]">
              建议：{signal.suggestion}
            </p>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>{signal.triggeredAt}</span>
              <span className="text-slate-400 transition-colors group-hover:text-[#10b981]">
                {expanded ? "收起详情 ▲" : "展开详情 ▼"}
              </span>
            </div>

            {expanded && (
              <div className="mt-3 border-t border-slate-700/50 pt-3">
                <p className="mb-1 text-xs font-medium text-slate-400">
                  分析逻辑
                </p>
                <p className="text-sm leading-relaxed text-slate-300">
                  {signal.detail}
                </p>
              </div>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

export default function SignalBoard({
  loading,
  error,
  data,
  updatedAt,
  onRetry,
}: SignalBoardProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <CardShell
      title="信号看板"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      updatedAt={updatedAt}
      onRetry={onRetry}
      className="!h-auto !min-h-0 !px-3 py-5 shadow-lg"
    >
      <ul className="flex flex-col gap-3">
        {data!.map((signal) => (
          <SignalRow key={signal.id} signal={signal} />
        ))}
      </ul>
    </CardShell>
  );
}
