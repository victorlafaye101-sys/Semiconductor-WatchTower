import { Component, type ErrorInfo, type ReactNode } from "react";

interface CardErrorBoundaryProps {
  children: ReactNode;
}

interface CardErrorBoundaryState {
  hasError: boolean;
}

export default class CardErrorBoundary extends Component<
  CardErrorBoundaryProps,
  CardErrorBoundaryState
> {
  state: CardErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CardErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[CardErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <article className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-700/50 bg-[#1e293b] p-5 text-center">
          <p className="text-sm text-slate-400">数据异常，请刷新重试</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-[#10b981]/40 bg-[#10b981]/10 px-4 py-2 text-sm text-[#10b981] transition-colors hover:bg-[#10b981]/20"
          >
            刷新页面
          </button>
        </article>
      );
    }

    return this.props.children;
  }
}
