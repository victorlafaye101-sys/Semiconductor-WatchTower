import CardShell from "./CardShell";
import type { IndexQuote } from "../types";

interface IndexGridProps {
  loading: boolean;
  error: string | null;
  data: IndexQuote[] | null;
  updatedAt?: string | null;
  onRetry?: () => void;
}

function changeColorClass(value: number): string {
  return value >= 0 ? "text-[#ef4444]" : "text-[#10b981]";
}

function formatPrice(price: number): string {
  return price.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function IndexGrid({
  loading,
  error,
  data,
  updatedAt,
  onRetry,
}: IndexGridProps) {
  const isEmpty = !data || data.length === 0;

  return (
    <CardShell
      title="指数联动"
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      updatedAt={updatedAt}
      onRetry={onRetry}
      className="h-full [&>h2]:mb-2"
    >
      <div className="grid flex-1 grid-cols-2 gap-2">
        {data!.map((index) => {
          if (index.error) {
            return (
              <div
                key={index.code}
                className="flex flex-col gap-1 rounded-lg border border-red-900/40 bg-slate-900/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {index.name}
                  </p>
                  <p className="font-mono-num mt-0.5 text-xs text-slate-500">
                    {index.code}
                  </p>
                </div>
                <p className="text-sm text-slate-400">
                  {index.message || "加载失败"}
                </p>
              </div>
            );
          }

          const isUp = (index.changePercent ?? 0) >= 0;

          return (
            <div
              key={index.code}
              className="flex flex-col gap-1 rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2 transition-colors hover:border-slate-600"
            >
              <div>
                <p className="text-sm font-semibold leading-tight text-white">
                  {index.name}
                </p>
                <p className="font-mono-num text-xs leading-tight text-slate-500">
                  {index.code}
                </p>
              </div>

              <div>
                <p className="font-mono-num text-xl font-bold leading-tight text-slate-100">
                  {formatPrice(index.price ?? 0)}
                </p>
                <p
                  className={`font-mono-num text-sm font-medium leading-tight ${changeColorClass(index.changePercent ?? 0)}`}
                >
                  {isUp ? "+" : ""}
                  {(index.changePercent ?? 0).toFixed(2)}%
                </p>
              </div>

              {index.stale && (
                <p className="text-[10px] leading-tight text-slate-500">数据可能滞后</p>
              )}
            </div>
          );
        })}
      </div>
    </CardShell>
  );
}
