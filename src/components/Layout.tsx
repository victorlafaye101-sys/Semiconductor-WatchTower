import type { ReactNode } from "react";
import { useRelativeUpdatedAt } from "../hooks/useRelativeUpdatedAt";

interface LayoutProps {
  children: ReactNode;
  updatedAt?: string | null;
}

export default function Layout({ children, updatedAt }: LayoutProps) {
  const relativeLabel = useRelativeUpdatedAt(updatedAt);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <header className="border-b border-slate-700/50 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              半导体<span className="text-[#10b981]">瞭望台</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              159813 · 存储 · 指数 · 信号一览
            </p>
          </div>
          <div className="max-w-xs text-right text-xs text-slate-500">
            {relativeLabel ? (
              <p className="text-slate-400">{relativeLabel}</p>
            ) : (
              <p>加载中...</p>
            )}
            <p className="mt-1 leading-relaxed">
              缓存期内更新时间不变属正常现象
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>

      <footer className="border-t border-slate-700/50 px-6 py-4 text-center text-xs text-slate-500">
        仅供个人投资研究 · 数据来源：东方财富 / TrendForce · 非投资建议
      </footer>
    </div>
  );
}
