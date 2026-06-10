/**
 * 159813 ETF 日 K 线 — push2his kline/get
 * f51 日期 | f52 开盘 | f53 收盘 | f54 最高 | f55 最低 | f56 成交量（份）
 */

const ETF_SECID = "0.159813";

const KLINE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://quote.eastmoney.com",
  Accept: "application/json, text/plain, */*",
};

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

function parseKlineRow(line: string): KlineBar | null {
  const parts = line.split(",");
  if (parts.length < 6) return null;

  const close = Number(parts[2]);
  const volume = Number(parts[5]);
  if (!Number.isFinite(close) || !Number.isFinite(volume)) return null;

  return { date: parts[0], close, volume };
}

function percentChange(current: number, past: number): number {
  return ((current - past) / past) * 100;
}

function buildDerived(
  bars: KlineBar[],
  currentPrice: number,
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
  };
}

export async function fetchEtfHistory(
  currentPrice: number,
): Promise<EtfHistoryDerived> {
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

  const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?${params}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: KLINE_HEADERS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`ETF K 线网络请求失败：${detail}`);
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(`ETF K 线 HTTP ${response.status}：${bodyText.slice(0, 200)}`);
  }

  const start = bodyText.indexOf("{");
  const end = bodyText.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("ETF K 线返回非 JSON");
  }

  const payload = JSON.parse(bodyText.slice(start, end + 1)) as KlineResponse;
  if (payload.rc !== 0 || !payload.data?.klines?.length) {
    throw new Error("ETF K 线 data 为空");
  }

  const bars = payload.data.klines
    .map(parseKlineRow)
    .filter((bar): bar is KlineBar => bar !== null);

  const derived = buildDerived(bars, currentPrice);
  if (!derived) {
    throw new Error("ETF K 线数据不足以计算阶段涨幅");
  }

  return derived;
}
