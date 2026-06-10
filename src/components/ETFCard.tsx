import type { ETFQuote } from "../types";
import UpdatedAtFooter from "./UpdatedAtFooter";

interface ETFCardProps {
  loading: boolean;
  error: string | null;
  data: ETFQuote | null;
  updatedAt: string | null;
  onRetry?: () => void;
}

const shellClass =
  "flex h-full min-h-[420px] flex-col rounded-xl border border-slate-700/50 bg-[#1e293b] p-6 md:col-span-2 lg:col-span-2 lg:row-span-2";

function formatVolume(value: number): string {
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)} 亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)} 万`;
  return value.toString();
}

function changeColorClass(value: number): string {
  return value >= 0 ? "text-[#ef4444]" : "text-[#10b981]";
}

function ETFSkeleton() {
  return (
    <div className="animate-pulse flex flex-1 flex-col gap-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <div className="h-5 w-28 rounded bg-slate-700/80" />
          <div className="h-4 w-16 rounded bg-slate-700/80" />
        </div>
        <div className="h-6 w-16 rounded-full bg-slate-700/80" />
      </div>
      <div className="h-12 w-48 rounded bg-slate-700/80" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-700/80" />
        ))}
      </div>
      <div className="h-24 rounded bg-slate-700/80" />
      <div className="h-4 w-2/3 rounded bg-slate-700/80" />
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 560;
  const height = 96;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-24 w-full"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function ETFCardSuccess({ data }: { data: ETFQuote }) {
  const isUp = data.changePercent >= 0;
  const changeColor = changeColorClass(data.changePercent);

  return (
    <>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{data.name}</h2>
          <p className="font-mono-num mt-1 text-sm text-slate-400">{data.code}</p>
        </div>
        <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-xs text-[#10b981]">
          实时行情
        </span>
      </div>

      <div className="mb-5 flex items-end gap-4">
        <p className="font-mono-num text-5xl font-bold tracking-tight text-white">
          {data.price.toFixed(3)}
        </p>
        <div className={`font-mono-num text-lg ${changeColor}`}>
          <span>
            {isUp ? "+" : ""}
            {data.change.toFixed(3)}
          </span>
          <span className="ml-2">
            {isUp ? "+" : ""}
            {data.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        {(
          [
            ["5日", data.periods["5d"]],
            ["1月", data.periods["1m"]],
            ["3月", data.periods["3m"]],
            ["1年", data.periods["1y"]],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2"
          >
            <p className="text-xs text-slate-500">{label}涨幅</p>
            <p className={`font-mono-num font-medium ${changeColorClass(value)}`}>
              {value >= 0 ? "+" : ""}
              {value.toFixed(2)}%
            </p>
          </div>
        ))}
      </div>

      <div className="mb-1">
        <p className="mb-1 text-xs text-slate-500">近 30 日走势</p>
        <Sparkline values={data.history30d} />
      </div>

      <div className="mb-4 flex gap-6 text-xs text-slate-400">
        <span>
          高 <span className="font-mono-num text-slate-300">{data.high}</span>
        </span>
        <span>
          低 <span className="font-mono-num text-slate-300">{data.low}</span>
        </span>
        <span>
          成交量{" "}
          <span className="font-mono-num text-slate-300">
            {formatVolume(data.volume)}
          </span>
        </span>
      </div>

    </>
  );
}

export default function ETFCard({
  loading,
  error,
  data,
  updatedAt,
  onRetry,
}: ETFCardProps) {
  const isEmpty = !loading && !error && !data;

  return (
    <article className={shellClass}>
      <div className="mb-4 flex items-start justify-between">
        <h2 className="text-sm font-medium text-[#10b981]">ETF 实时行情</h2>
        {!loading && !error && data && (
          <span className="rounded-full border border-[#10b981]/30 bg-[#10b981]/10 px-2 py-0.5 text-xs text-[#10b981]">
            实时行情
          </span>
        )}
      </div>

      {loading && (
        <div className="flex flex-1 flex-col">
          <p className="mb-4 text-sm text-slate-500">加载中...</p>
          <ETFSkeleton />
        </div>
      )}

      {!loading && error && (
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-slate-400">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-4 py-2 text-sm text-[#10b981] transition-colors hover:bg-[#10b981]/20"
            >
              点击重试
            </button>
          )}
        </div>
      )}

      {isEmpty && (
        <p className="flex flex-1 items-center justify-center text-sm text-slate-500">
          暂无数据，等待更新
        </p>
      )}

      {!loading && !error && data && (
        <>
          <ETFCardSuccess data={data} />
          <UpdatedAtFooter updatedAt={updatedAt} />
        </>
      )}
    </article>
  );
}
