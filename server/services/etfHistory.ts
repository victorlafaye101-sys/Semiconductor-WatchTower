/**
 * 159813 ETF 日 K 线
 * 主源：东方财富 push2his；境外/云主机常被封 → 腾讯 fqkline 兜底
 */

const ETF_SECID = "0.159813";
const TENCENT_SYMBOL = "sz159813";

const KLINE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://quote.eastmoney.com",
  Accept: "application/json, text/plain, */*",
};

const TENCENT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://gu.qq.com",
  Accept: "application/json, text/plain, */*",
};

const EASTMONEY_HOSTS = [
  "push2his.eastmoney.com",
  "push2hisdelay.eastmoney.com",
] as const;

/** 交易日回溯天数（约 1 月 / 3 月 / 1 年） */
const PERIOD_LOOKBACK = {
  "5d": 5,
  "1m": 22,
  "3m": 66,
  "1y": 252,
} as const;

export interface EtfHistoryDerived {
  history30d: number[];
  periods: {
    "5d": number;
    "1m": number;
    "3m": number;
    "1y": number;
  };
  volume: number;
  source: "eastmoney" | "tencent";
}

interface KlineBar {
  date: string;
  close: number;
  volume: number;
}

interface KlineResponse {
  rc?: number;
  data?: { klines?: string[] };
}

interface TencentKlineResponse {
  code?: number;
  data?: Record<string, { qfqday?: string[][] }>;
}

function parseEastmoneyRow(line: string): KlineBar | null {
  const parts = line.split(",");
  if (parts.length < 6) return null;

  const close = Number(parts[2]);
  const volume = Number(parts[5]);
  if (!Number.isFinite(close) || !Number.isFinite(volume)) return null;

  return { date: parts[0], close, volume };
}

function parseTencentRow(row: string[]): KlineBar | null {
  if (row.length < 6) return null;

  const close = Number(row[2]);
  const volume = Number(row[5]);
  if (!Number.isFinite(close) || !Number.isFinite(volume)) return null;

  return { date: row[0], close, volume };
}

function percentChange(current: number, past: number): number {
  return ((current - past) / past) * 100;
}

function buildDerived(
  bars: KlineBar[],
  currentPrice: number,
  source: EtfHistoryDerived["source"],
): EtfHistoryDerived | null {
  if (bars.length < 2) return null;

  const closes = bars.map((bar) => bar.close);
  const latestVolume = bars[bars.length - 1]?.volume ?? 0;

  const periods = {} as EtfHistoryDerived["periods"];
  for (const [key, lookback] of Object.entries(PERIOD_LOOKBACK) as Array<
    [keyof typeof PERIOD_LOOKBACK, number]
  >) {
    const pastIndex = closes.length - 1 - lookback;
    if (pastIndex < 0) {
      return null;
    }
    periods[key] = Number(
      percentChange(currentPrice, closes[pastIndex]).toFixed(2),
    );
  }

  const history30d = closes.slice(-29);
  history30d.push(currentPrice);

  return {
    history30d,
    periods,
    volume: latestVolume,
    source,
  };
}

async function fetchEastmoneyBars(): Promise<KlineBar[]> {
  const params = new URLSearchParams({
    fields1: "f1,f2,f3,f4,f5,f6",
    fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
    ut: "7eea3edcaed734bea9cbfc24409ed989",
    klt: "101",
    fqt: "0",
    secid: ETF_SECID,
    beg: "0",
    end: "20500101",
  });

  let lastError = "东方财富 K 线不可用";

  for (const host of EASTMONEY_HOSTS) {
    const url = `https://${host}/api/qt/stock/kline/get?${params}`;

    try {
      const response = await fetch(url, { headers: KLINE_HEADERS });
      const bodyText = await response.text();

      if (!response.ok) {
        lastError = `@${host} HTTP ${response.status}`;
        continue;
      }

      const start = bodyText.indexOf("{");
      const end = bodyText.lastIndexOf("}");
      if (start === -1 || end === -1) {
        lastError = `@${host} 返回非 JSON`;
        continue;
      }

      const payload = JSON.parse(bodyText.slice(start, end + 1)) as KlineResponse;
      if (payload.rc !== 0 || !payload.data?.klines?.length) {
        lastError = `@${host} data 为空`;
        continue;
      }

      const bars = payload.data.klines
        .map(parseEastmoneyRow)
        .filter((bar): bar is KlineBar => bar !== null);

      if (bars.length >= 2) {
        console.log(`[etf] kline source=eastmoney host=${host} bars=${bars.length}`);
        return bars;
      }

      lastError = `@${host} 解析后无有效 K 线`;
    } catch (err) {
      lastError =
        err instanceof Error ? err.message : `@${host} 网络请求失败`;
    }
  }

  throw new Error(lastError);
}

async function fetchTencentBars(): Promise<KlineBar[]> {
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${TENCENT_SYMBOL},day,,,320,qfq`;

  let response: Response;
  try {
    response = await fetch(url, { headers: TENCENT_HEADERS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`腾讯 K 线网络请求失败：${detail}`);
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`腾讯 K 线 HTTP ${response.status}：${bodyText.slice(0, 200)}`);
  }

  const payload = JSON.parse(bodyText) as TencentKlineResponse;
  const rows = payload.data?.[TENCENT_SYMBOL]?.qfqday;
  if (!rows?.length) {
    throw new Error("腾讯 K 线 data 为空");
  }

  const bars = rows
    .map(parseTencentRow)
    .filter((bar): bar is KlineBar => bar !== null);

  if (bars.length < 2) {
    throw new Error("腾讯 K 线解析后无有效数据");
  }

  console.log(`[etf] kline source=tencent bars=${bars.length}`);
  return bars;
}

export async function fetchEtfHistory(
  currentPrice: number,
): Promise<EtfHistoryDerived> {
  let bars: KlineBar[] | null = null;
  let source: EtfHistoryDerived["source"] = "eastmoney";

  try {
    bars = await fetchEastmoneyBars();
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(`[etf] eastmoney kline failed: ${detail}`);
    bars = await fetchTencentBars();
    source = "tencent";
  }

  const derived = buildDerived(bars, currentPrice, source);
  if (!derived) {
    throw new Error("K 线数据不足以计算阶段涨幅");
  }

  return derived;
}
