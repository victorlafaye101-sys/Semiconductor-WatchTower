import { getCache, getStaleCache, setCache } from "../utils/cache.js";
import { loadEtfQuote, type EtfQuoteData } from "./etfLoader.js";
import { loadFundFlow, type FundFlowLoadData } from "./fundLoader.js";
import { loadMemoryPrices, type MemoryPriceData } from "./memoryLoader.js";
import {
  computeSignals,
  type SignalItem,
} from "./signalEngine.js";

const CACHE_KEY = "signal_board";

export interface SignalLoadResult {
  code: number;
  message: string;
  data: SignalItem[] | null;
  updatedAt: string;
  stale?: boolean;
  error?: boolean;
}

async function gatherInputs(): Promise<{
  etf: EtfQuoteData | null;
  fund: FundFlowLoadData | null;
  memory: MemoryPriceData[] | null;
}> {
  const [etfResult, fundResult, memoryResult] = await Promise.all([
    loadEtfQuote({ skipCache: false, ttlSec: 30 }),
    loadFundFlow({ skipCache: false, ttlSec: 300 }),
    loadMemoryPrices({ skipCache: false, ttlSec: 300 }),
  ]);

  return {
    etf: etfResult.error ? null : etfResult.data,
    fund: fundResult.error ? null : fundResult.data,
    memory: memoryResult.error ? null : memoryResult.data,
  };
}

export async function loadSignalBoard(options: {
  skipCache: boolean;
  ttlSec: number;
}): Promise<SignalLoadResult> {
  if (!options.skipCache) {
    const hit = getCache<SignalItem[]>(CACHE_KEY);
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
    const inputs = await gatherInputs();
    const { signals, partialMissing, missingLabels } = computeSignals(inputs);
    const updatedAt = setCache(CACHE_KEY, signals, options.ttlSec);

    console.log(
      `[signal] computed ${signals.length} rules` +
        (partialMissing ? `, missing: ${missingLabels.join("、")}` : ""),
    );

    if (partialMissing) {
      return {
        code: 1004,
        message: "部分指标数据缺失，信号可能不准确",
        data: signals,
        updatedAt,
      };
    }

    return { code: 0, message: "success", data: signals, updatedAt };
  } catch (err) {
    const detail =
      err instanceof Error ? err.message : "信号引擎计算失败";
    console.warn(`[signal] compute failed: ${detail}`);

    const staleHit = getStaleCache<SignalItem[]>(CACHE_KEY);
    if (staleHit) {
      return {
        code: 1001,
        message: "信号计算失败，返回缓存数据",
        data: staleHit.data,
        updatedAt: staleHit.updatedAt,
        stale: true,
      };
    }

    return {
      error: true,
      code: 5005,
      message: `信号计算异常：${detail}`,
      data: null,
      updatedAt: new Date().toISOString(),
    };
  }
}
