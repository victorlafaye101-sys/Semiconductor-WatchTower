import Layout from "./components/Layout";
import ETFCard from "./components/ETFCard";
import IndexGrid from "./components/IndexGrid";
import PriceFuel from "./components/PriceFuel";
import FundFlow from "./components/FundFlow";
import SignalBoard from "./components/SignalBoard";
import CardErrorBoundary from "./components/CardErrorBoundary";
import PageLoading from "./components/PageLoading";
import { useSemiconductorData } from "./hooks/useSemiconductorData";

export default function App() {
  const {
    globalLoading,
    updatedAt,
    etf,
    index,
    memory,
    fund,
    signal,
    retry,
  } = useSemiconductorData();

  return (
    <Layout updatedAt={updatedAt}>
      {globalLoading ? (
        <PageLoading />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[3fr_2fr] lg:items-stretch">
          {/* 左列 ~60% */}
          <div className="flex h-full flex-col gap-4">
            <div className="w-full shrink-0 [&_article]:!h-auto [&_article]:!min-h-0">
              <CardErrorBoundary>
                <ETFCard
                  loading={etf.loading}
                  error={etf.error}
                  data={etf.data}
                  updatedAt={etf.updatedAt}
                  onRetry={retry.etf}
                />
              </CardErrorBoundary>
            </div>

            <div className="grid flex-1 grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
              <CardErrorBoundary>
                <div className="h-full">
                  <IndexGrid
                    loading={index.loading}
                    error={index.error}
                    data={index.data}
                    updatedAt={index.updatedAt}
                    onRetry={retry.index}
                  />
                </div>
              </CardErrorBoundary>

              <CardErrorBoundary>
                <div className="h-full">
                  <FundFlow
                    loading={fund.loading}
                    error={fund.error}
                    data={fund.data}
                    updatedAt={fund.updatedAt}
                    onRetry={retry.fund}
                  />
                </div>
              </CardErrorBoundary>
            </div>
          </div>

          {/* 右列 ~40% */}
          <div className="flex h-full w-full flex-col gap-4">
            <CardErrorBoundary>
              <PriceFuel
                loading={memory.loading}
                error={memory.error}
                data={memory.data}
                updatedAt={memory.updatedAt}
                hint={memory.hint}
                stale={memory.stale}
                onRetry={retry.memory}
              />
            </CardErrorBoundary>

            <CardErrorBoundary>
              <SignalBoard
                loading={signal.loading}
                error={signal.error}
                data={signal.data}
                updatedAt={signal.updatedAt}
                onRetry={retry.signal}
              />
            </CardErrorBoundary>
          </div>
        </div>
      )}
    </Layout>
  );
}
