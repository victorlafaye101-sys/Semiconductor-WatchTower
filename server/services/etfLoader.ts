import { mockEtfQuote } from "../data/mock.js";
import { getCache, getStaleCache, setCache } from "../utils/cache.js";
import { fetchEtfHistory } from "./etfHistory.js";
import { fetchEtfQuoteLive, type EtfQuoteLive } from "./etfQuote.js";

export type EtfQuoteData = typeof mockEtfQuote;

const CACHE_KEY = "etf_quote";

export interface EtfLoadResult {
  code: number;
  message: string;
  data: EtfQuoteData | null;
  updatedAt: string;
  stale?: boolean;
  error?: boolean;
}

/**
 * 拉取东方财富实时行情 + 日 K 线推导阶段涨幅与 30 日走势
 */
export async function fetchETFQuote(): Promise<EtfQuoteData> {
  const live = await fetchEtfQuoteLive();
  return enrichEtfQuote(live);
}

/**
 * 实时价来自 push2；periods / history30d / volume 来自 push2his 日 K 线
 */
export async function enrichEtfQuote(live: EtfQuoteLive): Promise<EtfQuoteData> {
  const base = {
    ...mockEtfQuote,
    name: live.name,
    code: live.code,
    price: live.price,
    change: live.change,
    changePercent: live.changePercent,
    high: live.high,
    low: live.low,
  };

  try {
    const history = await fetchEtfHistory(live.price);
    return {
      ...base,
      volume: history.volume,
      history30d: history.history30d,
      periods: history.periods,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(`[etf] kline unavailable, omitting history: ${detail}`);
    return {
      ...base,
      volume: 0,
      history30d: [],
      periods: {
        "5d": 0,
        "1m": 0,
        "3m": 0,
        "1y": 0,
      },
    };
  }
}

export async function loadEtfQuote(options: {
  skipCache: boolean;
  ttlSec: number;
}): Promise<EtfLoadResult> {
  if (!options.skipCache) {
    const hit = getCache<EtfQuoteData>(CACHE_KEY);
    if (hit) {
      console.log(`[cache hit] ${CACHE_KEY}`);
      return {
        code: 0,
        message: "success",
        data: hit.data,
        updatedAt: hit.updatedAt,
      };
    }
  }

  try {
    const data = await fetchETFQuote();
    const updatedAt = setCache(CACHE_KEY, data, options.ttlSec);
    console.log(`[etf] live quote: price=${data.price}`);
    return { code: 0, message: "success", data, updatedAt };
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "东方财富 API 不可用";
    console.warn(`[etf] fetchETFQuote failed: ${detail}`);

    const staleHit = getStaleCache<EtfQuoteData>(CACHE_KEY);
    if (staleHit) {
      console.warn(`[etf] serving stale cache`);
      return {
        code: 1001,
        message: "上游接口限流，返回缓存数据",
        data: staleHit.data,
        updatedAt: staleHit.updatedAt,
        stale: true,
      };
    }

    return {
      error: true,
      code: 5001,
      message: "行情数据获取失败，请稍后重试",
      data: null,
      updatedAt: new Date().toISOString(),
    };
  }
}
