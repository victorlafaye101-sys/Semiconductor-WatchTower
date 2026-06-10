import cors from "cors";
import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEtfQuote } from "./services/etfLoader.js";
import { loadFundFlow } from "./services/fundLoader.js";
import { loadIndexList } from "./services/indexLoader.js";
import { loadMemoryPrices } from "./services/memoryLoader.js";
import { loadSignalBoard } from "./services/signalLoader.js";
import { getCache, setCache } from "./utils/cache.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const PORT = 3001;

const TTL = {
  ETF: 30,
  INDEX: 60,
  FUND: 300,
  MEMORY: 300,
  SIGNAL: 300,
} as const;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
  }),
);

app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

function shouldSkipCache(req: Request): boolean {
  return req.query.refresh === "1";
}

interface CachedLoadResult<T> {
  code: number;
  message: string;
  data: T;
  updatedAt: string;
}

function loadCachedData<T>(
  key: string,
  ttlSec: number,
  skipCache: boolean,
  loader: () => T,
): CachedLoadResult<T> {
  if (!skipCache) {
    const hit = getCache<T>(key);
    if (hit) {
      console.log(`[cache hit] ${key}`);
      return {
        code: 0,
        message: "success",
        data: hit.data,
        updatedAt: hit.updatedAt,
      };
    }
  }

  const data = loader();
  const updatedAt = setCache(key, data, ttlSec);
  return { code: 0, message: "success", data, updatedAt };
}

function cachedJson<T>(
  req: Request,
  res: Response,
  key: string,
  ttlSec: number,
  loader: () => T,
): void {
  const result = loadCachedData(key, ttlSec, shouldSkipCache(req), loader);
  res.json({
    code: result.code,
    message: result.message,
    data: result.data,
    updatedAt: result.updatedAt,
  });
}

interface OverviewCardSlot<T> {
  ok: boolean;
  data: T | null;
  updatedAt: string;
  message?: string;
  stale?: boolean;
}

interface OverviewData {
  etf: OverviewCardSlot<NonNullable<Awaited<ReturnType<typeof loadEtfQuote>>["data"]>>;
  indexes: OverviewCardSlot<
    NonNullable<Awaited<ReturnType<typeof loadIndexList>>["data"]>
  >;
  memoryPrices: OverviewCardSlot<
    NonNullable<Awaited<ReturnType<typeof loadMemoryPrices>>["data"]>
  >;
  fundFlow: OverviewCardSlot<
    NonNullable<Awaited<ReturnType<typeof loadFundFlow>>["data"]>
  >;
  signals: OverviewCardSlot<
    NonNullable<Awaited<ReturnType<typeof loadSignalBoard>>["data"]>
  >;
}

interface AsyncCardLoadResult<T> {
  code: number;
  message: string;
  data: T | null;
  updatedAt: string;
  stale?: boolean;
  error?: boolean;
}

function toOverviewCardSlot<T>(
  settled: PromiseSettledResult<AsyncCardLoadResult<T>>,
  label: string,
): OverviewCardSlot<T> {
  if (settled.status === "rejected") {
    const detail =
      settled.reason instanceof Error
        ? settled.reason.message
        : String(settled.reason);
    console.warn(`[overview] ${label} rejected: ${detail}`);
    return {
      ok: false,
      data: null,
      updatedAt: new Date().toISOString(),
      message: `${label}加载失败，请稍后重试`,
    };
  }

  const result = settled.value;
  if (result.error || result.data == null) {
    console.warn(`[overview] ${label} failed: ${result.message}`);
    return {
      ok: false,
      data: null,
      updatedAt: result.updatedAt,
      message: result.message,
    };
  }

  return {
    ok: true,
    data: result.data,
    updatedAt: result.updatedAt,
    ...(result.stale ? { stale: true } : {}),
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/etf/quote", async (req, res) => {
  const result = await loadEtfQuote({
    skipCache: shouldSkipCache(req),
    ttlSec: TTL.ETF,
  });

  res.json({
    code: result.code,
    message: result.message,
    data: result.data,
    updatedAt: result.updatedAt,
    ...(result.stale ? { stale: true } : {}),
    ...(result.error ? { error: true } : {}),
  });
});

app.get("/api/index/list", async (req, res) => {
  const result = await loadIndexList({
    skipCache: shouldSkipCache(req),
    ttlSec: TTL.INDEX,
  });

  if (result.error) {
    res.status(503).json({
      error: true,
      code: result.code,
      message: result.message,
      data: null,
      updatedAt: result.updatedAt,
    });
    return;
  }

  res.json({
    code: result.code,
    message: result.message,
    data: result.data,
    updatedAt: result.updatedAt,
    ...(result.stale ? { stale: true } : {}),
  });
});

app.get("/api/fund/flow", async (req, res) => {
  const result = await loadFundFlow({
    skipCache: shouldSkipCache(req),
    ttlSec: TTL.FUND,
  });

  if (result.error) {
    res.status(503).json({
      error: true,
      code: result.code,
      message: result.message,
      data: null,
      updatedAt: result.updatedAt,
    });
    return;
  }

  res.json({
    code: result.code,
    message: result.message,
    data: result.data,
    updatedAt: result.updatedAt,
    ...(result.stale ? { stale: true } : {}),
  });
});

app.get("/api/memory/price", async (req, res) => {
  const result = await loadMemoryPrices({
    skipCache: shouldSkipCache(req),
    ttlSec: TTL.MEMORY,
  });

  if (result.error) {
    res.status(500).json({
      error: true,
      code: result.code,
      message: result.message,
      data: null,
      updatedAt: result.updatedAt,
    });
    return;
  }

  res.json({
    code: result.code,
    message: result.message,
    data: result.data,
    updatedAt: result.updatedAt,
    ...(result.stale ? { stale: true } : {}),
  });
});

app.get("/api/signal/board", async (req, res) => {
  const result = await loadSignalBoard({
    skipCache: shouldSkipCache(req),
    ttlSec: TTL.SIGNAL,
  });

  if (result.error) {
    res.status(500).json({
      error: true,
      code: result.code,
      message: result.message,
      data: null,
      updatedAt: result.updatedAt,
    });
    return;
  }

  res.json({
    code: result.code,
    message: result.message,
    data: result.data,
    updatedAt: result.updatedAt,
    ...(result.stale ? { stale: true } : {}),
  });
});

app.get("/api/overview", async (_req, res) => {
  // 各卡从独立缓存组装；overview 的 refresh=1 不向下游传递
  const [etfSettled, indexSettled, memorySettled, fundSettled, signalSettled] =
    await Promise.allSettled([
      loadEtfQuote({ skipCache: false, ttlSec: TTL.ETF }),
      loadIndexList({ skipCache: false, ttlSec: TTL.INDEX }),
      loadMemoryPrices({ skipCache: false, ttlSec: TTL.MEMORY }),
      loadFundFlow({ skipCache: false, ttlSec: TTL.FUND }),
      loadSignalBoard({ skipCache: false, ttlSec: TTL.SIGNAL }),
    ]);

  const overview: OverviewData = {
    etf: toOverviewCardSlot(etfSettled, "ETF 行情"),
    indexes: toOverviewCardSlot(indexSettled, "指数联动"),
    memoryPrices: toOverviewCardSlot(memorySettled, "产业价格"),
    fundFlow: toOverviewCardSlot(fundSettled, "资金流向"),
    signals: toOverviewCardSlot(signalSettled, "信号看板"),
  };

  const slots = Object.values(overview);
  const failed = slots.filter((slot) => !slot.ok).length;
  const stale = slots.some((slot) => slot.ok && slot.stale);

  const updatedAt =
    slots
      .map((slot) => slot.updatedAt)
      .sort()
      .reverse()[0] ?? new Date().toISOString();

  let code = 0;
  let message = "success";
  if (failed > 0) {
    code = 1001;
    message = `${failed} 张卡片数据不可用，其余正常返回`;
  } else if (stale) {
    code = 1001;
    message = "部分数据可能滞后";
  }

  res.json({
    code,
    message,
    data: overview,
    updatedAt,
    ...(failed > 0 || stale ? { stale: true } : {}),
  });
});

app.use((_req, res) => {
  res.status(404).json({
    code: 404,
    message: "Not Found",
    data: null,
    updatedAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
