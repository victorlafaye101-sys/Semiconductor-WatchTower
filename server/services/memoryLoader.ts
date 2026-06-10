import { mockMemoryPrices } from "../data/mock.js";
import { getCache, getStaleCache, setCache } from "../utils/cache.js";
import {
  fetchMemoryPricesFromFeishu,
  isFeishuConfigured,
  type MemoryPriceRow,
} from "./feishuMemory.js";

const CACHE_KEY = "memory_price";

export type MemoryPriceData = MemoryPriceRow;

export interface MemoryLoadResult {
  code: number;
  message: string;
  data: MemoryPriceData[] | null;
  updatedAt: string;
  stale?: boolean;
  error?: boolean;
}

function mockFallback(message: string): MemoryLoadResult {
  return {
    code: 1002,
    message,
    data: mockMemoryPrices,
    updatedAt: new Date().toISOString(),
    stale: true,
  };
}

export async function loadMemoryPrices(options: {
  skipCache: boolean;
  ttlSec: number;
}): Promise<MemoryLoadResult> {
  if (!options.skipCache) {
    const hit = getCache<MemoryPriceData[]>(CACHE_KEY);
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

  if (!isFeishuConfigured()) {
    console.warn("[memory] Feishu not configured, using mock");
    const updatedAt = setCache(CACHE_KEY, mockMemoryPrices, options.ttlSec);
    return {
      code: 1002,
      message: "飞书表格未配置，返回示例数据",
      data: mockMemoryPrices,
      updatedAt,
      stale: true,
    };
  }

  try {
    const data = await fetchMemoryPricesFromFeishu();
    const updatedAt = setCache(CACHE_KEY, data, options.ttlSec);
    console.log(`[memory] feishu rows=${data.length}`);
    return { code: 0, message: "success", data, updatedAt };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "飞书 API 不可用";
    console.warn(`[memory] fetch failed: ${detail}`);

    if (detail.includes("鉴权失败")) {
      return {
        error: true,
        code: 5003,
        message: "飞书 API 凭证无效，请检查 FEISHU_APP_ID 和 FEISHU_APP_SECRET",
        data: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const staleHit = getStaleCache<MemoryPriceData[]>(CACHE_KEY);
    if (staleHit) {
      return {
        code: 1001,
        message: "飞书数据不可用，返回缓存数据",
        data: staleHit.data,
        updatedAt: staleHit.updatedAt,
        stale: true,
      };
    }

    return mockFallback("飞书数据不可用，返回示例数据");
  }
}
