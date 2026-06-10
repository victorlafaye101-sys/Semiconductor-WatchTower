/**
 * 指数联动：国证芯片 / 科创50（东方财富）+ 费城半导体 SOX（新浪财经，Yahoo 备用）
 */

const EASTMONEY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.eastmoney.com",
  Accept: "application/json, text/plain, */*",
};

const YAHOO_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "application/json",
};

const SINA_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://finance.sina.com.cn",
};

export interface IndexQuoteItem {
  name: string;
  code: string;
  price: number;
  changePercent: number;
}

interface EastMoneyPayload {
  rc?: number;
  data?: Record<string, string | number | null> | null;
}

interface EastMoneyIndexConfig {
  /** 东方财富 secid：国证芯片实测为 0.980017（文档示例 1.980017 无数据） */
  secid: string;
  name: string;
  code: string;
}

const EASTMONEY_INDICES: EastMoneyIndexConfig[] = [
  { secid: "0.980017", name: "国证芯片", code: "980017" },
  { secid: "1.000688", name: "科创50", code: "000688" },
];

const EASTMONEY_HOSTS = [
  "push2.eastmoney.com",
  "push2delay.eastmoney.com",
] as const;

function parseEastMoneyBody(raw: string): EastMoneyPayload {
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("东方财富返回非 JSON 格式");
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as EastMoneyPayload;
  } catch {
    throw new Error("东方财富 JSON 解析失败");
  }
}

/** 指数点位：东方财富 ×100 存储，需 ÷100（与 ETF 的 ÷1000 不同） */
function scaleIndexPrice(raw: number | string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error("东方财富指数字段无效");
  }
  return n / 100;
}

/** 涨跌幅 %：f170，÷100 */
function scaleChangePercent(raw: number | string | null | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) {
    throw new Error("东方财富涨跌幅字段无效");
  }
  return n / 100;
}

async function requestEastMoneyIndex(
  config: EastMoneyIndexConfig,
  host: (typeof EASTMONEY_HOSTS)[number],
): Promise<IndexQuoteItem> {
  const fields = "f43,f170,f57,f58";
  const url = `https://${host}/api/qt/stock/get?secid=${config.secid}&fields=${fields}&cb=`;

  let response: Response;
  try {
    response = await fetch(url, { headers: EASTMONEY_HEADERS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`${config.name}@${host} 网络请求失败：${detail}`);
  }

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(
      `${config.name}@${host} HTTP ${response.status} ${response.statusText}，响应片段：${bodyText.slice(0, 200)}`,
    );
  }

  const payload = parseEastMoneyBody(bodyText);

  if (payload.rc !== 0 || !payload.data) {
    throw new Error(
      `${config.name}@${host} 业务错误：rc=${payload.rc ?? "unknown"}，data 为空`,
    );
  }

  const data = payload.data;
  const name = String(data.f58 ?? config.name).trim();

  return {
    name,
    code: config.code,
    price: scaleIndexPrice(data.f43),
    changePercent: scaleChangePercent(data.f170),
  };
}

/**
 * 东方财富单指数（多 host 重试）
 * f58 → name | f43 → price（÷100） | f170 → changePercent（÷100）
 */
async function fetchEastMoneyIndex(
  config: EastMoneyIndexConfig,
): Promise<IndexQuoteItem> {
  const errors: string[] = [];

  for (const host of EASTMONEY_HOSTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await requestEastMoneyIndex(config, host);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        errors.push(detail);
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }
  }

  throw new Error(`${config.name} 全部请求失败：${errors.join(" | ")}`);
}

interface YahooChartMeta {
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  chartPreviousClose?: number;
  previousClose?: number;
}

function logSoxSourceError(source: string, err: unknown, extra?: string): void {
  const detail = err instanceof Error ? err.message : String(err);
  console.warn(
    `[index] 费城半导体 SOX [${source}] failed: ${detail}${extra ? ` | ${extra}` : ""}`,
  );
}

/**
 * Yahoo Finance ^SOX（国内环境常被 403 拦截）
 * chart API meta.regularMarketPrice / regularMarketChangePercent
 */
async function fetchSoxFromYahoo(): Promise<IndexQuoteItem> {
  const symbol = "^SOX";
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;

  let response: Response;
  try {
    response = await fetch(url, { headers: YAHOO_HEADERS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Yahoo 网络请求失败：${detail}`);
  }

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Yahoo HTTP ${response.status} ${response.statusText}，响应片段：${bodyText.slice(0, 400)}`,
    );
  }

  let json: { chart?: { result?: Array<{ meta?: YahooChartMeta }> } };
  try {
    json = JSON.parse(bodyText) as typeof json;
  } catch {
    throw new Error(
      `Yahoo JSON 解析失败，响应片段：${bodyText.slice(0, 400)}`,
    );
  }

  const meta = json.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  if (price == null || !Number.isFinite(price)) {
    throw new Error(
      `Yahoo 缺少报价数据，响应片段：${bodyText.slice(0, 400)}`,
    );
  }

  let changePercent = meta.regularMarketChangePercent;
  if (changePercent == null || !Number.isFinite(changePercent)) {
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    if (prev != null && prev !== 0) {
      changePercent = ((price - prev) / prev) * 100;
    } else {
      changePercent = 0;
    }
  }

  return {
    name: "费城半导体",
    code: "SOX",
    price,
    changePercent,
  };
}

/**
 * 新浪财经 gb_$sox（国内可访问的 ^SOX 实时报价）
 * 字段：name, price, changePercent, datetime, changeAmt, open, high, low, ...
 */
async function fetchSoxFromSina(): Promise<IndexQuoteItem> {
  const url = "https://hq.sinajs.cn/list=gb_$sox";

  let response: Response;
  try {
    response = await fetch(url, { headers: SINA_HEADERS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`新浪 网络请求失败：${detail}`);
  }

  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(
      `新浪 HTTP ${response.status} ${response.statusText}，响应片段：${bodyText.slice(0, 400)}`,
    );
  }

  const match = bodyText.match(/="([^"]*)"/);
  if (!match?.[1]) {
    throw new Error(
      `新浪响应格式异常，响应片段：${bodyText.slice(0, 400)}`,
    );
  }

  const fields = match[1].split(",");
  const price = Number(fields[1]);
  const changePercent = Number(fields[2]);

  if (!Number.isFinite(price)) {
    throw new Error(
      `新浪 price 无效（fields[1]=${fields[1] ?? "empty"}），响应片段：${bodyText.slice(0, 400)}`,
    );
  }
  if (!Number.isFinite(changePercent)) {
    throw new Error(
      `新浪 changePercent 无效（fields[2]=${fields[2] ?? "empty"}），响应片段：${bodyText.slice(0, 400)}`,
    );
  }

  return {
    name: "费城半导体",
    code: "SOX",
    price,
    changePercent,
  };
}

/** Yahoo 优先；403 等失败时自动切换新浪财经 */
async function fetchSoxQuote(): Promise<IndexQuoteItem> {
  try {
    const quote = await fetchSoxFromYahoo();
    console.log("[index] 费城半导体 SOX [Yahoo]: price=", quote.price);
    return quote;
  } catch (yahooErr) {
    logSoxSourceError("Yahoo", yahooErr);
    try {
      const quote = await fetchSoxFromSina();
      console.log("[index] 费城半导体 SOX [Sina]: price=", quote.price);
      return quote;
    } catch (sinaErr) {
      logSoxSourceError("Sina", sinaErr);
      const yahooMsg =
        yahooErr instanceof Error ? yahooErr.message : String(yahooErr);
      const sinaMsg =
        sinaErr instanceof Error ? sinaErr.message : String(sinaErr);
      throw new Error(
        `费城半导体 SOX 全部数据源失败 | Yahoo: ${yahooMsg} | Sina: ${sinaMsg}`,
      );
    }
  }
}

/**
 * 并行拉取三个指数；单个失败仅记录日志，不拖垮其余结果
 */
export async function fetchIndexQuotes(): Promise<IndexQuoteItem[]> {
  const tasks: Array<{
    label: string;
    run: () => Promise<IndexQuoteItem>;
  }> = [
    ...EASTMONEY_INDICES.map((cfg) => ({
      label: cfg.name,
      run: () => fetchEastMoneyIndex(cfg),
    })),
    { label: "费城半导体 SOX", run: fetchSoxQuote },
  ];

  const settled = await Promise.all(
    tasks.map(async ({ label, run }) => {
      try {
        const quote = await run();
        console.log(`[index] ${label}: price=${quote.price}`);
        return quote;
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.warn(`[index] ${label} failed: ${detail}`);
        return null;
      }
    }),
  );

  return settled.filter((item): item is IndexQuoteItem => item !== null);
}
