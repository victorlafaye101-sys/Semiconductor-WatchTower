import type { ReactNode } from "react";
import UpdatedAtFooter from "./UpdatedAtFooter";

interface CardShellProps {
  title: string;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  updatedAt?: string | null;
  hint?: string | null;
  stale?: boolean;
  onRetry?: () => void;
  className?: string;
  children: ReactNode;
  footerExtra?: ReactNode;
}

function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-1/3 rounded bg-slate-700/80" />
      <div className="h-8 w-2/3 rounded bg-slate-700/80" />
      <div className="h-16 rounded bg-slate-700/80" />
      <div className="h-12 rounded bg-slate-700/80" />
    </div>
  );
}

function CardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <p className="text-sm text-slate-400">{message}</p>
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
  );
}

function CardEmpty() {
  return (
    <p className="flex flex-1 items-center justify-center py-8 text-sm text-slate-500">
      暂无数据，等待更新
    </p>
  );
}

export default function CardShell({
  title,
  loading,
  error,
  isEmpty,
  updatedAt,
  hint,
  stale,
  onRetry,
  className = "",
  children,
  footerExtra,
}: CardShellProps) {
  const showContent = !loading && !error && !isEmpty;

  return (
    <article
      className={`flex h-full min-h-[280px] flex-col rounded-xl border border-slate-700/50 bg-[#1e293b] p-5 ${className}`}
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium text-[#10b981]">{title}</h2>
        {stale && hint && (
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">
            {hint}
          </span>
        )}
      </div>

      {loading && <CardSkeleton />}
      {!loading && error && <CardError message={error} onRetry={onRetry} />}
      {!loading && !error && isEmpty && <CardEmpty />}
      {showContent && <div className="flex flex-1 flex-col">{children}</div>}
      {showContent && footerExtra}
      {showContent && <UpdatedAtFooter updatedAt={updatedAt} />}
    </article>
  );
}
