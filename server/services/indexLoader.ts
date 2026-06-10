import { mockIndexList } from "../data/mock.js";
import { getCache, getStaleCache, setCache } from "../utils/cache.js";
import {
  fetchIndexQuotes,
  type IndexQuoteItem,
} from "./indexQuotes.js";

const CACHE_KEY = "index_list";

const INDEX_ORDER = ["980017", "SOX", "000688"] as const;

type IndexQuoteSuccess = (typeof mockIndexList)[number];

export type IndexQuoteData =
  | IndexQuoteSuccess
  | {
      name: string;
      code: string;
      error: true;
      message: string;
    };

export interface IndexLoadResult {
  code: number;
  message: string;
  data: IndexQuoteData[] | null;
  updatedAt: string;
  stale?: boolean;
  error?: boolean;
}

function indexCacheKey(code: string): string {
  return `index:${code}`;
}

function indexMeta(code: (typeof INDEX_ORDER)[number]) {
  const mock = mockIndexList.find((m) => m.code === code);
  return {
    name: mock?.name ?? code,
    code,
  };
}

function enrichWithHistory(live: IndexQuoteItem): IndexQuoteSuccess {
  const mock = mockIndexList.find((m) => m.code === live.code);
  return {
    name: live.name,
    code: live.code,
    price: live.price,
    changePercent: live.changePercent,
    ...(mock?.history30d ? { history30d: mock.history30d } : {}),
  };
}

function errorEntry(code: (typeof INDEX_ORDER)[number]): IndexQuoteData {
  const meta = indexMeta(code);
  return {
    name: meta.name,
    code: meta.code,
    error: true,
    message: "指数数据获取失败，请稍后重试",
  };
}

function isSuccessEntry(
  item: IndexQuoteData,
): item is IndexQuoteSuccess {
  return !("error" in item && item.error === true);
}

/**
 * 实时结果 + 单指数缓存；失败条目标记 error: true，不用 Mock 价格补全
 */
function assembleIndexList(
  live: IndexQuoteItem[],
  options: { skipCache: boolean; ttlSec: number },
): {
  data: IndexQuoteData[];
  partial: boolean;
  stale: boolean;
} {
  const liveByCode = new Map(
    live.map((item) => [item.code, enrichWithHistory(item)]),
  );

  for (const [code, item] of liveByCode) {
    setCache(indexCacheKey(code), item, options.ttlSec);
  }

  const data: IndexQuoteData[] = [];
  let partial = false;
  let stale = false;

  for (const code of INDEX_ORDER) {
    const fresh = liveByCode.get(code);
    if (fresh) {
      data.push(fresh);
      continue;
    }

    if (!options.skipCache) {
      const hit = getCache<IndexQuoteSuccess>(indexCacheKey(code));
      if (hit) {
        data.push(hit.data);
        continue;
      }
    }

    const staleHit = getStaleCache<IndexQuoteSuccess>(indexCacheKey(code));
    if (staleHit) {
      data.push({ ...staleHit.data, stale: true });
      partial = true;
      stale = true;
      console.warn(`[index] ${code} using per-index stale cache`);
      continue;
    }

    partial = true;
    console.warn(`[index] ${code} unavailable, returning error entry`);
    data.push(errorEntry(code));
  }

  return { data, partial, stale };
}

export async function loadIndexList(options: {
  skipCache: boolean;
  ttlSec: number;
}): Promise<IndexLoadResult> {
  if (!options.skipCache) {
    const hit = getCache<IndexQuoteData[]>(CACHE_KEY);
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

  const live = await fetchIndexQuotes();
  const { data, partial, stale } = assembleIndexList(live, options);

  const successCount = data.filter(isSuccessEntry).length;

  if (successCount === 0) {
    const staleHit = getStaleCache<IndexQuoteData[]>(CACHE_KEY);
    if (staleHit) {
      console.warn("[index] all entries failed, serving stale aggregate cache");
      return {
        code: 1001,
        message: "指数数据源不可用，返回缓存数据",
        data: staleHit.data,
        updatedAt: staleHit.updatedAt,
        stale: true,
      };
    }

    return {
      error: true,
      code: 5002,
      message: "指数数据获取失败，请稍后重试",
      data: null,
      updatedAt: new Date().toISOString(),
    };
  }

  const updatedAt = setCache(CACHE_KEY, data, options.ttlSec);

  if (partial) {
    const failedCount = data.length - successCount;
    console.warn(
      `[index] partial data (${live.length}/3 live, ${failedCount} error entries)`,
    );
    return {
      code: 1001,
      message: stale
        ? "部分指数使用缓存数据"
        : `${failedCount} 个指数获取失败，其余正常返回`,
      data,
      updatedAt,
      stale: true,
    };
  }

  return { code: 0, message: "success", data, updatedAt };
}
