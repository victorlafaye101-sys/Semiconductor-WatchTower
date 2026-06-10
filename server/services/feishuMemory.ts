/**
 * 飞书多维表格 → 产业价格燃料
 * API：tenant_access_token + bitable records
 */

export interface MemoryPriceRow {
  name: string;
  period: string;
  changePercent: number;
  prevPeriod: string;
  /** 飞书有「上月环比%」等列时才有值，否则为 null 不展示 */
  prevChangePercent: number | null;
  status: "hot" | "warning" | "cold";
  statusLabel: string;
  source: string;
}

interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
}

interface TenantTokenResponse {
  code?: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
}

interface BitableRecordsResponse {
  code?: number;
  msg?: string;
  data?: {
    items?: Array<{ fields?: Record<string, unknown> }>;
    has_more?: boolean;
    page_token?: string;
  };
}

type FeishuFieldValue = unknown;

const FIELD_ALIASES: Record<keyof MemoryPriceRow, string[]> = {
  name: ["名称", "name", "产品", "规格"],
  period: ["周期", "period", "当季", "月份"],
  changePercent: [
    "环比涨幅",
    "changePercent",
    "涨幅",
    "当季涨幅",
    "月环比%",
    "月环比",
  ],
  prevPeriod: ["上期周期", "prevPeriod", "上期", "上月"],
  prevChangePercent: [
    "上期环比涨幅",
    "prevChangePercent",
    "上期涨幅",
    "上期环比",
    "上月环比%",
  ],
  status: ["状态", "status"],
  statusLabel: ["状态标签", "statusLabel", "标签"],
  source: ["来源", "source", "数据源"],
};

let cachedToken: { token: string; expiresAt: number } | null = null;

export function getFeishuConfig(): FeishuConfig | null {
  const appId = process.env.FEISHU_APP_ID?.trim();
  const appSecret = process.env.FEISHU_APP_SECRET?.trim();
  const appToken = process.env.FEISHU_APP_TOKEN?.trim();
  const tableId = process.env.FEISHU_TABLE_ID?.trim();

  if (!appId || !appSecret || !appToken || !tableId) {
    return null;
  }

  return { appId, appSecret, appToken, tableId };
}

export function isFeishuConfigured(): boolean {
  return getFeishuConfig() !== null;
}

/** 飞书日期字段常为毫秒时间戳，格式化为 2026年6月 */
function parseFeishuDate(value: FeishuFieldValue): Date | null {
  if (value == null) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e12 ? value : value * 1000;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const text = fieldToString(value);
  if (!text) return null;

  if (/^\d{13}$/.test(text)) {
    const date = new Date(Number(text));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (/^\d{10}$/.test(text)) {
    const date = new Date(Number(text) * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const compact = text.match(/^(\d{4})(\d{2})$/);
  if (compact) {
    return new Date(Number(compact[1]), Number(compact[2]) - 1, 1);
  }

  const labeled = text.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月?$/);
  if (labeled) {
    return new Date(Number(labeled[1]), Number(labeled[2]) - 1, 1);
  }

  const dashed = text.match(/^(\d{4})[-/](\d{1,2})/);
  if (dashed) {
    return new Date(Number(dashed[1]), Number(dashed[2]) - 1, 1);
  }

  return null;
}

function formatPeriodLabel(value: FeishuFieldValue): string {
  const date = parseFeishuDate(value);
  if (date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  }

  const raw = fieldToString(value);
  const compact = raw.match(/^(\d{4})(\d{2})$/);
  if (compact) {
    return `${compact[1]}年${Number(compact[2])}月`;
  }

  return raw;
}

function previousMonthLabel(date: Date): string {
  const prev = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return `${prev.getFullYear()}年${prev.getMonth() + 1}月`;
}

function fieldToString(value: FeishuFieldValue): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "text" in item) {
          return String((item as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("")
      .trim();
  }
  if (typeof value === "object" && value !== null && "text" in value) {
    return String((value as { text?: string }).text ?? "").trim();
  }
  return "";
}

function fieldToNumber(value: FeishuFieldValue): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = fieldToString(value).replace(/%/g, "").trim();
  const num = Number(text);
  return Number.isFinite(num) ? num : NaN;
}

function pickField(
  fields: Record<string, FeishuFieldValue>,
  aliases: string[],
): FeishuFieldValue {
  for (const key of aliases) {
    if (key in fields) return fields[key];
  }
  const lowerMap = new Map(
    Object.entries(fields).map(([k, v]) => [k.toLowerCase(), v]),
  );
  for (const key of aliases) {
    const hit = lowerMap.get(key.toLowerCase());
    if (hit !== undefined) return hit;
  }
  return undefined;
}

function normalizeStatus(raw: string): MemoryPriceRow["status"] {
  const value = raw.toLowerCase();
  if (value === "hot" || value.includes("热") || value.includes("充足")) {
    return "hot";
  }
  if (value === "cold" || value.includes("冷")) {
    return "cold";
  }
  return "warning";
}

function defaultStatusLabel(status: MemoryPriceRow["status"]): string {
  if (status === "hot") return "🔥 动能充足";
  if (status === "cold") return "❄️ 景气偏弱";
  return "⚠️ 涨幅收窄";
}

function statusFromChangePercent(changePercent: number): MemoryPriceRow["status"] {
  if (changePercent >= 30) return "hot";
  if (changePercent < 10) return "cold";
  return "warning";
}

function mapRecord(fields: Record<string, FeishuFieldValue>): MemoryPriceRow | null {
  const name = fieldToString(pickField(fields, FIELD_ALIASES.name));
  const periodRaw = pickField(fields, FIELD_ALIASES.period);
  const periodDate = parseFeishuDate(periodRaw);
  const period = formatPeriodLabel(periodRaw);
  const changePercent = fieldToNumber(
    pickField(fields, FIELD_ALIASES.changePercent),
  );
  const prevPeriodRaw = fieldToString(
    pickField(fields, FIELD_ALIASES.prevPeriod),
  );
  const prevPeriod =
    prevPeriodRaw ||
    (periodDate ? previousMonthLabel(periodDate) : "—");
  const prevChangeRaw = pickField(fields, FIELD_ALIASES.prevChangePercent);
  const prevChangePercent = Number.isFinite(fieldToNumber(prevChangeRaw))
    ? fieldToNumber(prevChangeRaw)
    : null;
  const statusRaw = fieldToString(pickField(fields, FIELD_ALIASES.status));
  const statusLabelRaw = fieldToString(
    pickField(fields, FIELD_ALIASES.statusLabel),
  );
  const source = fieldToString(pickField(fields, FIELD_ALIASES.source)) || "飞书录入";

  let resolvedChangePercent = changePercent;
  if (!Number.isFinite(resolvedChangePercent)) {
    const currentPrice = fieldToNumber(
      pickField(fields, ["合约均价($)", "合约均价", "均价"]),
    );
    const prevPrice = fieldToNumber(
      pickField(fields, ["上月均价($)", "上月均价", "上期均价"]),
    );
    if (
      Number.isFinite(currentPrice) &&
      Number.isFinite(prevPrice) &&
      prevPrice !== 0
    ) {
      resolvedChangePercent =
        ((currentPrice - prevPrice) / prevPrice) * 100;
    }
  }

  if (!name || !period || !Number.isFinite(resolvedChangePercent)) {
    return null;
  }

  const status =
    statusRaw || statusLabelRaw
      ? normalizeStatus(statusRaw || statusLabelRaw)
      : statusFromChangePercent(resolvedChangePercent);

  return {
    name,
    period,
    changePercent: resolvedChangePercent,
    prevPeriod,
    prevChangePercent,
    status,
    statusLabel: statusLabelRaw || defaultStatusLabel(status),
    source,
  };
}

async function fetchTenantAccessToken(config: FeishuConfig): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const response = await fetch(
    "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: config.appId,
        app_secret: config.appSecret,
      }),
    },
  );

  const payload = (await response.json()) as TenantTokenResponse;
  if (!response.ok || payload.code !== 0 || !payload.tenant_access_token) {
    throw new Error(
      `飞书鉴权失败：${payload.msg ?? `HTTP ${response.status}`}`,
    );
  }

  const ttlMs = Math.max((payload.expire ?? 7200) - 120, 60) * 1000;
  cachedToken = {
    token: payload.tenant_access_token,
    expiresAt: Date.now() + ttlMs,
  };

  return payload.tenant_access_token;
}

async function fetchAllRecords(
  config: FeishuConfig,
  token: string,
): Promise<MemoryPriceRow[]> {
  const rows: MemoryPriceRow[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({ page_size: "100" });
    if (pageToken) params.set("page_token", pageToken);

    const url =
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}` +
      `/tables/${config.tableId}/records?${params}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = (await response.json()) as BitableRecordsResponse;
    if (!response.ok || payload.code !== 0) {
      throw new Error(
        `飞书表格读取失败：${payload.msg ?? `HTTP ${response.status}`}`,
      );
    }

    for (const item of payload.data?.items ?? []) {
      if (!item.fields) continue;
      const row = mapRecord(item.fields);
      if (row) rows.push(row);
    }

    pageToken = payload.data?.has_more
      ? payload.data.page_token
      : undefined;
  } while (pageToken);

  return rows;
}

export async function fetchMemoryPricesFromFeishu(): Promise<MemoryPriceRow[]> {
  const config = getFeishuConfig();
  if (!config) {
    throw new Error("飞书未配置");
  }

  const token = await fetchTenantAccessToken(config);
  const rows = await fetchAllRecords(config, token);

  if (rows.length === 0) {
    throw new Error("飞书表格无有效数据行（请检查列名与必填字段）");
  }

  return rows;
}
