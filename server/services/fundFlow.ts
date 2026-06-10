/**
 * 资金流向：北向资金（沪深港通）+ 159813 ETF 份额
 * 数据源：东方财富 datacenter + push2 ETF 列表 + pingzhongdata 季报份额锚点
 */

const EASTMONEY_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.eastmoney.com",
  Accept: "application/json, text/plain, */*",
};

const HSGT_HEADERS = {
  ...EASTMONEY_HEADERS,
  Referer: "https://data.eastmoney.com/hsgt/index.html",
};

const ETF_CODE = "159813";

const EASTMONEY_HOSTS = [
  "push2.eastmoney.com",
  "push2delay.eastmoney.com",
] as const;

/** 北向资金合计：MUTUAL_TYPE=006 */
const NORTHBOUND_MUTUAL_TYPE = "006";

export interface FundFlowNorthBound {
  today: number;
  "5d": number[];
  error?: string;
}

export interface FundFlowEtfShare {
  current: number;
  change1m: number;
  change1mPercent: number;
  error?: string;
}

export interface FundFlowData {
  northBound: FundFlowNorthBound;
  etfShare: FundFlowEtfShare;
}

interface DatacenterResponse<T> {
  success?: boolean;
  result?: { data?: T[] };
  message?: string;
}

interface NorthboundRow {
  TRADE_DATE?: string;
  /** 成交净买入，单位：万元 */
  NET_DEAL_AMT?: number | null;
}

interface KamtMarket {
  /** 当日净买入额，单位：元（盘中实时） */
  netBuyAmt?: number;
  date2?: string;
}

interface KamtResponse {
  rc?: number;
  data?: {
    hk2sh?: KamtMarket;
    hk2sz?: KamtMarket;
  };
}

interface EtfClistRow {
  f12?: string;
  /** 最新份额，单位：份 */
  f38?: number;
  f297?: number;
  /** 近 1 月份额变化率，单位：%（"-" 表示无数据） */
  f184?: number | string;
}

function parseJsonBody<T>(raw: string): T {
  const text = raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("东方财富返回非 JSON 格式");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

function toYuanFromWan(value: number): number {
  return value * 10_000;
}

function tradingDatesDesc(rows: NorthboundRow[]): NorthboundRow[] {
  const seen = new Set<string>();
  const unique: NorthboundRow[] = [];
  for (const row of rows) {
    const date = row.TRADE_DATE?.slice(0, 10);
    if (!date || seen.has(date)) continue;
    seen.add(date);
    unique.push(row);
  }
  return unique;
}

/**
 * 北向资金历史：datacenter RPT_MUTUAL_DEAL_HISTORY
 * MUTUAL_TYPE=006 → 北向合计
 * NET_DEAL_AMT → 当日净流入（万元），输出转为元
 */
async function fetchNorthboundHistory(): Promise<NorthboundRow[]> {
  const filter = `(MUTUAL_TYPE%3D%22${NORTHBOUND_MUTUAL_TYPE}%22)`;
  const url =
    `https://datacenter-web.eastmoney.com/api/data/v1/get?` +
    `reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,NET_DEAL_AMT&` +
    `pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&` +
    `source=WEB&client=WEB&filter=${filter}`;

  let response: Response;
  try {
    response = await fetch(url, { headers: HSGT_HEADERS });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`北向资金历史网络请求失败：${detail}`);
  }

  const bodyText = await response.text();
  if (!response.ok) {
    throw new Error(
      `北向资金历史 HTTP ${response.status}，响应片段：${bodyText.slice(0, 200)}`,
    );
  }

  const payload = parseJsonBody<DatacenterResponse<NorthboundRow>>(bodyText);
  if (!payload.success || !payload.result?.data?.length) {
    throw new Error(
      `北向资金历史业务错误：${payload.message ?? "data 为空"}`,
    );
  }

  return tradingDatesDesc(payload.result.data);
}

/**
 * 北向资金盘中：push2 kamt/get
 * hk2sh.netBuyAmt + hk2sz.netBuyAmt → 沪股通 + 深股通实时净买入（元）
 */
async function fetchNorthboundRealtime(): Promise<{
  today: number;
  date: string;
} | null> {
  const url =
    "https://push2delay.eastmoney.com/api/qt/kamt/get?fields1=f1,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65";

  let response: Response;
  try {
    response = await fetch(url, { headers: HSGT_HEADERS });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const payload = parseJsonBody<KamtResponse>(await response.text());
  const hk2sh = payload.data?.hk2sh;
  const hk2sz = payload.data?.hk2sz;
  if (!hk2sh || !hk2sz) return null;

  const sh = Number(hk2sh.netBuyAmt);
  const sz = Number(hk2sz.netBuyAmt);
  if (!Number.isFinite(sh) || !Number.isFinite(sz)) return null;
  if (sh === 0 && sz === 0) return null;

  return {
    today: sh + sz,
    date: hk2sh.date2 ?? hk2sz.date2 ?? "",
  };
}

async function fetchNorthBound(): Promise<FundFlowNorthBound> {
  const history = await fetchNorthboundHistory();
  const dated = history.filter(
    (row) => row.NET_DEAL_AMT != null && Number.isFinite(row.NET_DEAL_AMT),
  );

  if (dated.length === 0) {
    throw new Error("北向资金缺少有效 NET_DEAL_AMT 数据");
  }

  const latest = dated[0];
  const latestDate = latest.TRADE_DATE?.slice(0, 10) ?? "";
  let today = toYuanFromWan(Number(latest.NET_DEAL_AMT));

  const realtime = await fetchNorthboundRealtime();
  if (realtime && realtime.date === latestDate) {
    today = realtime.today;
  }

  const fiveDays = dated
    .slice(0, 5)
    .map((row) => toYuanFromWan(Number(row.NET_DEAL_AMT)))
    .reverse();

  return { today, "5d": fiveDays };
}

/**
 * ETF 份额：push2 ETF 列表 clist
 * f12 → 代码 | f38 → 最新份额（份）| f184 → 近 1 月份额变化率（%）| f297 → 数据日期 YYYYMMDD
 */
async function fetchEtfShareFromClist(): Promise<{
  current: number;
  dataDate: string;
  change1mPercent?: number;
}> {
  const fields = "f12,f38,f184,f297";
  const baseParams = {
    pz: "100",
    po: "1",
    np: "1",
    ut: "bd1d9ddb04089700cf9c27f6f7426281",
    fltt: "2",
    invt: "2",
    wbp2u: "|0|0|0|web",
    fid: "f12",
    fs: "b:MK0021,b:MK0022,b:MK0023,b:MK0024,b:MK0827",
    fields,
  };

  const errors: string[] = [];

  for (const host of EASTMONEY_HOSTS) {
    for (let page = 1; page <= 20; page++) {
      const params = new URLSearchParams({
        ...baseParams,
        pn: String(page),
      });
      const url = `https://${host}/api/qt/clist/get?${params}`;

      try {
        const response = await fetch(url, { headers: EASTMONEY_HEADERS });
        const bodyText = await response.text();
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const payload = parseJsonBody<{
          data?: { diff?: EtfClistRow[] };
        }>(bodyText);
        const row = payload.data?.diff?.find((item) => item.f12 === ETF_CODE);
        if (!row) continue;

        const current = Number(row.f38);
        if (!Number.isFinite(current)) {
          throw new Error(`f38 无效：${row.f38 ?? "empty"}`);
        }

        const dataDate = String(row.f297 ?? "");
        const rawF184 = row.f184;
        const change1mPercent =
          typeof rawF184 === "number" && Number.isFinite(rawF184)
            ? rawF184
            : undefined;

        return { current, dataDate, change1mPercent };
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        errors.push(`@${host} p${page}: ${detail}`);
      }
    }
  }

  throw new Error(`ETF 份额查询失败：${errors.join(" | ")}`);
}

interface ShareAnchor {
  date: Date;
  /** 亿份 */
  sharesYi: number;
}

/**
 * pingzhongdata Data_buySedemption
 * 总份额序列（亿份）+ categories 季报日期，用于估算约 1 个月前份额
 */
async function fetchShareAnchors(): Promise<ShareAnchor[]> {
  const url = `https://fund.eastmoney.com/pingzhongdata/${ETF_CODE}.js?v=1`;
  const response = await fetch(url, {
    headers: { ...EASTMONEY_HEADERS, Referer: "https://fund.eastmoney.com" },
  });

  if (!response.ok) {
    throw new Error(`pingzhongdata HTTP ${response.status}`);
  }

  const text = await response.text();
  const match = text.match(/var Data_buySedemption\s*=\s*(\{[\s\S]*?\});/);
  if (!match?.[1]) {
    throw new Error("pingzhongdata 缺少 Data_buySedemption");
  }

  const data = JSON.parse(match[1]) as {
    categories?: string[];
    series?: Array<{ name?: string; data?: number[] }>;
  };

  const totalSeries = data.series?.find((s) => s.name === "总份额");
  if (!totalSeries?.data?.length || !data.categories?.length) {
    throw new Error("pingzhongdata 总份额序列为空");
  }

  const anchors: ShareAnchor[] = [];
  for (let i = 0; i < data.categories.length; i++) {
    const sharesYi = Number(totalSeries.data[i]);
    const date = new Date(data.categories[i]);
    if (!Number.isFinite(sharesYi) || Number.isNaN(date.getTime())) continue;
    anchors.push({ date, sharesYi });
  }

  if (anchors.length === 0) {
    throw new Error("pingzhongdata 无有效季报锚点");
  }

  return anchors.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function interpolateShareYi(anchors: ShareAnchor[], target: Date): number {
  if (anchors.length === 0) {
    throw new Error("季报锚点为空");
  }

  const time = target.getTime();
  if (time <= anchors[0].date.getTime()) return anchors[0].sharesYi;
  const last = anchors[anchors.length - 1];
  if (time >= last.date.getTime()) {
    if (anchors.length >= 2) {
      const prev = anchors[anchors.length - 2];
      const dayMs = 86_400_000;
      const slope =
        (last.sharesYi - prev.sharesYi) /
        ((last.date.getTime() - prev.date.getTime()) / dayMs);
      const days = (time - last.date.getTime()) / dayMs;
      return last.sharesYi + slope * days;
    }
    return last.sharesYi;
  }

  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const next = anchors[i];
    if (time > next.date.getTime()) continue;

    const span = next.date.getTime() - prev.date.getTime();
    const ratio = (time - prev.date.getTime()) / span;
    return prev.sharesYi + (next.sharesYi - prev.sharesYi) * ratio;
  }

  return last.sharesYi;
}

function shareChangeFromPercent(
  current: number,
  change1mPercent: number,
): { change1m: number; change1mPercent: number } {
  const past = current / (1 + change1mPercent / 100);
  return {
    change1m: Math.round(current - past),
    change1mPercent: Number(change1mPercent.toFixed(2)),
  };
}

function estimateShareOneMonthAgo(anchors: ShareAnchor[]): number {
  const target = new Date();
  target.setDate(target.getDate() - 30);
  return interpolateShareYi(anchors, target) * 1e8;
}

async function fetchEtfShareFromPingzhongdata(
  current: number,
): Promise<{ change1m: number; change1mPercent: number }> {
  const anchors = await fetchShareAnchors();
  const share1mAgo = estimateShareOneMonthAgo(anchors);
  const change1m = current - share1mAgo;
  const change1mPercent =
    share1mAgo !== 0 ? (change1m / share1mAgo) * 100 : 0;

  return {
    change1m: Math.round(change1m),
    change1mPercent: Number(change1mPercent.toFixed(2)),
  };
}

async function fetchEtfShare(): Promise<FundFlowEtfShare> {
  const { current, change1mPercent: clistPercent } =
    await fetchEtfShareFromClist();

  const change =
    clistPercent != null
      ? shareChangeFromPercent(current, clistPercent)
      : await fetchEtfShareFromPingzhongdata(current);

  return {
    current: Math.round(current),
    change1m: change.change1m,
    change1mPercent: change.change1mPercent,
  };
}

/**
 * 并行拉取资金流向；单项失败不影响另一项
 */
export async function fetchFundFlow(): Promise<FundFlowData> {
  const [northResult, etfResult] = await Promise.allSettled([
    fetchNorthBound(),
    fetchEtfShare(),
  ]);

  const northBound: FundFlowNorthBound =
    northResult.status === "fulfilled"
      ? northResult.value
      : {
          today: 0,
          "5d": [0, 0, 0, 0, 0],
          error:
            northResult.reason instanceof Error
              ? northResult.reason.message
              : "北向资金获取失败",
        };

  const etfShare: FundFlowEtfShare =
    etfResult.status === "fulfilled"
      ? etfResult.value
      : {
          current: 0,
          change1m: 0,
          change1mPercent: 0,
          error:
            etfResult.reason instanceof Error
              ? etfResult.reason.message
              : "ETF 份额获取失败",
        };

  if (northResult.status === "rejected") {
    console.warn(
      `[fund] northBound failed: ${
        northResult.reason instanceof Error
          ? northResult.reason.message
          : northResult.reason
      }`,
    );
  } else {
    console.log(`[fund] northBound today=${northBound.today}`);
  }

  if (etfResult.status === "rejected") {
    console.warn(
      `[fund] etfShare failed: ${
        etfResult.reason instanceof Error
          ? etfResult.reason.message
          : etfResult.reason
      }`,
    );
  } else {
    console.log(
      `[fund] etfShare current=${etfShare.current} change1m=${etfShare.change1m}`,
    );
  }

  return { northBound, etfShare };
}
