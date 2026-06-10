export default function PageLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-slate-600 border-t-[#10b981]"
        aria-hidden
      />
      <p className="text-sm text-slate-400">加载中...</p>
    </div>
  );
}
