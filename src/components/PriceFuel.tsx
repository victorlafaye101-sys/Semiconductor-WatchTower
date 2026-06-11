import CardShell from "./CardShell";
import type { MemoryPrice } from "../types";

interface PriceFuelProps {
  loading: boolean;
  error: string | null;
  data: MemoryPrice[] | null;
  updatedAt?: string | null;
  hint?: string | null;
  stale?: boolean;
  onRetry?: () => void;
}

const statusStyles: Record<
  MemoryPrice["status"],
  { badge: string; accent: string }
> = {
  hot: {
    badge: "border-[#10b981]/40 bg-[#10b981]/15 text-[#10b981]",
    accent: "border-l-[#10b981]",
  },
  warning: {
    badge: "border-[#f59e0b]/40 bg-[#f59e0b]/15 text-[#f59e0b]",
    accent: "border-l-[#f59e0b]",
  },
  cold: {
    badge: "border-[#ef4444]/40 bg-[#ef4444]/15 text-[#ef4444]",
    accent: "border-l-[#ef4444]",
  },
};

export default function PriceFuel({
  loading,
  error,
  data,
  updatedAt,
  hint,
  stale,
  onRetry,
}: PriceFuelProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <CardShell
      title="产业价格燃料"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      updatedAt={updatedAt}
      hint={hint}
      stale={stale}
      onRetry={onRetry}
      className="!h-auto !min-h-0 !px-3 py-5"
      footerExtra={
        <p className="mt-3 border-t border-slate-700/50 pt-3 text-xs text-slate-500">
          数据来源：TrendForce / 手动录入
        </p>
      }
    >
      <ul className="flex flex-col gap-3">
        {data!.map((item) => {
          const style = statusStyles[item.status];

          return (
            <li
              key={item.name}
              className={`rounded-lg border border-slate-700/50 border-l-4 bg-slate-900/40 px-3 py-3 ${style.accent}`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{item.name}</p>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${style.badge}`}
                >
                  {item.statusLabel}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                <p className="text-slate-400">
                  周期{" "}
                  <span className="font-mono-num text-slate-200">
                    {item.period}
                  </span>
                </p>
                <p>
                  <span className="text-slate-400">环比涨幅 </span>
                  <span
                    className={`font-mono-num font-semibold ${
                      item.changePercent >= 0
                        ? "text-[#ef4444]"
                        : "text-[#10b981]"
                    }`}
                  >
                    {item.changePercent >= 0 ? "+" : ""}
                    {item.changePercent.toFixed(2)}%
                  </span>
                </p>
                {item.prevChangePercent != null && (
                  <p className="text-xs text-slate-500">
                    {item.prevPeriod} 环比{" "}
                    {item.prevChangePercent >= 0 ? "+" : ""}
                    {item.prevChangePercent.toFixed(2)}%
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

    </CardShell>
  );
}
