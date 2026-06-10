import CardShell from "./CardShell";
import type { FundFlow as FundFlowData } from "../types";

interface FundFlowProps {
  loading: boolean;
  error: string | null;
  data: FundFlowData | null;
  updatedAt?: string | null;
  onRetry?: () => void;
}

function formatMoney(value: number): string {
  const abs = Math.abs(value);
  const sign = value >= 0 ? "+" : "-";
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(2)} 亿`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(0)} 万`;
  return `${sign}${abs}`;
}

function formatShare(value: number): string {
  return `${(value / 100000000).toFixed(2)} 亿份`;
}

function changeColorClass(value: number): string {
  return value >= 0 ? "text-[#ef4444]" : "text-[#10b981]";
}

export default function FundFlow({
  loading,
  error,
  data,
  updatedAt,
  onRetry,
}: FundFlowProps) {
  const isEmpty = !data;

  return (
    <CardShell
      title="资金流向"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      updatedAt={updatedAt}
      onRetry={onRetry}
      className="h-full [&>h2]:mb-2"
    >
      {(() => {
        const flow = data!;
        const today = flow.northBound.today;

        return (
          <>
            <div className="mb-2 rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2.5">
              <p className="mb-1 text-xs text-slate-500">北向资金 · 今日净流入</p>
              <p
                className={`font-mono-num text-xl font-semibold ${changeColorClass(today)}`}
              >
                {formatMoney(today)}
              </p>
              <div className="mt-2 flex gap-1">
                {flow.northBound["5d"].map((value, i) => {
                  const max = Math.max(
                    ...flow.northBound["5d"].map((v) => Math.abs(v)),
                  );
                  const height = max ? (Math.abs(value) / max) * 100 : 0;
                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="flex h-12 w-full items-end justify-center">
                        <div
                          className={`w-full max-w-6 rounded-sm ${value >= 0 ? "bg-red-500/70" : "bg-emerald-500/70"}`}
                          style={{ height: `${Math.max(height, 8)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-600">
                        D{i + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/40 bg-slate-900/30 px-3 py-2.5">
              <p className="mb-1 text-xs text-slate-500">159813 ETF 份额</p>
              <p className="font-mono-num text-lg text-white">
                {formatShare(flow.etfShare.current)}
              </p>
              <p
                className={`font-mono-num mt-1 text-sm ${changeColorClass(flow.etfShare.change1mPercent)}`}
              >
                近 1 月 {formatMoney(flow.etfShare.change1m)} (
                {flow.etfShare.change1mPercent >= 0 ? "+" : ""}
                {flow.etfShare.change1mPercent.toFixed(2)}%)
              </p>
            </div>
          </>
        );
      })()}
    </CardShell>
  );
}
