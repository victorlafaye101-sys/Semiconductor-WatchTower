import { useCallback, useEffect, useState } from "react";
import { getApiBase } from "../api/index";
import {
  fetchAllData,
  fetchETFQuote,
  fetchFundFlow,
  fetchIndexList,
  fetchMemoryPrice,
  fetchSignalBoard,
  type OverviewCardResult,
} from "../../client/src/api/semiconductor";
import type { CardDataState } from "../types/cardState";
import type {
  ETFQuote,
  FundFlow,
  IndexQuote,
  MemoryPrice,
  SignalItem,
} from "../types";

function initialState<T>(): CardDataState<T> {
  return { loading: true, error: null, data: null, updatedAt: null };
}

function successState<T>(
  data: T,
  updatedAt: string,
  meta?: Pick<CardDataState<T>, "hint" | "stale">,
): CardDataState<T> {
  return {
    loading: false,
    error: null,
    data,
    updatedAt,
    ...meta,
  };
}

function errorState<T>(message: string): CardDataState<T> {
  return { loading: false, error: message, data: null, updatedAt: null };
}

function cardStateFromOverview<T>(
  result: OverviewCardResult<T>,
  fallbackMessage: string,
): CardDataState<T> {
  if (result.ok && result.data != null) {
    return successState(result.data, result.updatedAt, {
      hint: result.message,
      stale: result.stale,
    });
  }
  return errorState(result.message || fallbackMessage);
}

function latestUpdatedAt(
  results: OverviewCardResult<unknown>[],
  fallback: string,
): string {
  const timestamps = results
    .filter((r) => r.ok && r.updatedAt)
    .map((r) => r.updatedAt);
  if (timestamps.length === 0) {
    return fallback;
  }
  return timestamps.reduce((latest, current) =>
    current > latest ? current : latest,
  );
}

export function useSemiconductorData() {
  const [globalLoading, setGlobalLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [etf, setEtf] = useState(initialState<ETFQuote>);
  const [index, setIndex] = useState(initialState<IndexQuote[]>);
  const [memory, setMemory] = useState(initialState<MemoryPrice[]>);
  const [fund, setFund] = useState(initialState<FundFlow>);
  const [signal, setSignal] = useState(initialState<SignalItem[]>);

  const applyOverview = useCallback(
    (data: Awaited<ReturnType<typeof fetchAllData>>) => {
      setEtf(cardStateFromOverview(data.etf, "ETF 行情加载失败"));
      setIndex(cardStateFromOverview(data.indexes, "指数数据加载失败"));
      setMemory(cardStateFromOverview(data.memoryPrices, "产业价格加载失败"));
      setFund(cardStateFromOverview(data.fundFlow, "资金流向加载失败"));
      setSignal(cardStateFromOverview(data.signals, "信号看板加载失败"));
      setUpdatedAt(
        latestUpdatedAt(
          [
            data.etf,
            data.indexes,
            data.memoryPrices,
            data.fundFlow,
            data.signals,
          ],
          data.updatedAt,
        ),
      );
    },
    [],
  );

  const applyOverviewTransportError = useCallback((message: string) => {
    setEtf(errorState(message));
    setIndex(errorState(message));
    setMemory(errorState(message));
    setFund(errorState(message));
    setSignal(errorState(message));
    setUpdatedAt(null);
  }, []);

  const loadAll = useCallback(async () => {
    setGlobalLoading(true);
    setEtf(initialState());
    setIndex(initialState());
    setMemory(initialState());
    setFund(initialState());
    setSignal(initialState());

    if (import.meta.env.PROD && !getApiBase()) {
      applyOverviewTransportError(
        "未配置后端地址：请在 Vercel 设置环境变量 VITE_API_BASE 为 Railway 后端 URL（无末尾斜杠），保存后重新部署",
      );
      setGlobalLoading(false);
      return;
    }

    try {
      const data = await fetchAllData();
      applyOverview(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "数据加载失败，请稍后重试";
      applyOverviewTransportError(message);
    } finally {
      setGlobalLoading(false);
    }
  }, [applyOverview, applyOverviewTransportError]);

  const loadEtf = useCallback(async () => {
    setEtf((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, updatedAt: at } = await fetchETFQuote();
      setEtf(successState(data, at));
      setUpdatedAt(at);
    } catch (err) {
      setEtf(
        errorState(
          err instanceof Error ? err.message : "ETF 行情加载失败",
        ),
      );
    }
  }, []);

  const loadIndex = useCallback(async () => {
    setIndex((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, updatedAt: at } = await fetchIndexList();
      setIndex(successState(data, at));
    } catch (err) {
      setIndex(
        errorState(
          err instanceof Error ? err.message : "指数数据加载失败",
        ),
      );
    }
  }, []);

  const loadMemory = useCallback(async () => {
    setMemory((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, updatedAt: at } = await fetchMemoryPrice();
      setMemory(successState(data, at));
    } catch (err) {
      setMemory(
        errorState(
          err instanceof Error ? err.message : "产业价格加载失败",
        ),
      );
    }
  }, []);

  const loadFund = useCallback(async () => {
    setFund((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, updatedAt: at } = await fetchFundFlow();
      setFund(successState(data, at));
    } catch (err) {
      setFund(
        errorState(
          err instanceof Error ? err.message : "资金流向加载失败",
        ),
      );
    }
  }, []);

  const loadSignal = useCallback(async () => {
    setSignal((s) => ({ ...s, loading: true, error: null }));
    try {
      const { data, updatedAt: at } = await fetchSignalBoard();
      setSignal(successState(data, at));
    } catch (err) {
      setSignal(
        errorState(
          err instanceof Error ? err.message : "信号看板加载失败",
        ),
      );
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return {
    globalLoading,
    updatedAt,
    etf,
    index,
    memory,
    fund,
    signal,
    retry: {
      etf: loadEtf,
      index: loadIndex,
      memory: loadMemory,
      fund: loadFund,
      signal: loadSignal,
      all: loadAll,
    },
  };
}
