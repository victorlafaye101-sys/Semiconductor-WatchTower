import { getCache, getStaleCache, setCache } from "../utils/cache.js";
import {
  fetchFundFlow,
  type FundFlowData,
} from "./fundFlow.js";

const CACHE_KEY = "fund_flow";

export type FundFlowLoadData = FundFlowData;

export interface FundLoadResult {
  code: number;
  message: string;
  data: FundFlowLoadData | null;
  updatedAt: string;
  stale?: boolean;
  error?: boolean;
}

function partialMessage(data: FundFlowData): string {
  const northErr = Boolean(data.northBound.error);
  const etfErr = Boolean(data.etfShare.error);
  if (northErr && !etfErr) return "北向资金接口不可用，ETF 份额数据正常";
  if (!northErr && etfErr) return "ETF 份额接口不可用，北向资金数据正常";
  return "部分资金流向数据不可用";
}

export async function loadFundFlow(options: {
  skipCache: boolean;
  ttlSec: number;
}): Promise<FundLoadResult> {
  if (!options.skipCache) {
    const hit = getCache<FundFlowLoadData>(CACHE_KEY);
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
    const data = await fetchFundFlow();
    const northErr = Boolean(data.northBound.error);
    const etfErr = Boolean(data.etfShare.error);

    if (northErr && etfErr) {
      const staleHit = getStaleCache<FundFlowLoadData>(CACHE_KEY);
      if (staleHit) {
        console.warn("[fund] all sources failed, serving stale cache");
        return {
          code: 1001,
          message: "资金流向数据源不可用，返回缓存数据",
          data: staleHit.data,
          updatedAt: staleHit.updatedAt,
          stale: true,
        };
      }

      return {
        error: true,
        code: 5004,
        message: "资金流向数据源全部不可用",
        data: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const updatedAt = setCache(CACHE_KEY, data, options.ttlSec);

    if (northErr || etfErr) {
      console.warn(`[fund] partial data northErr=${northErr} etfErr=${etfErr}`);
      return {
        code: 1003,
        message: partialMessage(data),
        data,
        updatedAt,
      };
    }

    return { code: 0, message: "success", data, updatedAt };
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "东方财富 API 不可用";
    console.warn(`[fund] loadFundFlow failed: ${detail}`);

    const staleHit = getStaleCache<FundFlowLoadData>(CACHE_KEY);
    if (staleHit) {
      return {
        code: 1001,
        message: "资金流向数据源不可用，返回缓存数据",
        data: staleHit.data,
        updatedAt: staleHit.updatedAt,
        stale: true,
      };
    }

    return {
      error: true,
      code: 5004,
      message: "资金流向数据源全部不可用",
      data: null,
      updatedAt: new Date().toISOString(),
    };
  }
}
