import { apiUrl } from "../../../src/api/index";
import type {
  ApiResponse,
  ETFQuote,
  FundFlow,
  IndexQuote,
  MemoryPrice,
  SignalItem,
} from "../../../src/types";

export interface OverviewCardResult<T> {
  ok: boolean;
  data: T | null;
  updatedAt: string;
  message?: string;
  stale?: boolean;
}

export interface OverviewPayload {
  etf: OverviewCardResult<ETFQuote>;
  indexes: OverviewCardResult<IndexQuote[]>;
  memoryPrices: OverviewCardResult<MemoryPrice[]>;
  fundFlow: OverviewCardResult<FundFlow>;
  signals: OverviewCardResult<SignalItem[]>;
}

export interface AllDataResult {
  etf: OverviewCardResult<ETFQuote>;
  indexes: OverviewCardResult<IndexQuote[]>;
  memoryPrices: OverviewCardResult<MemoryPrice[]>;
  fundFlow: OverviewCardResult<FundFlow>;
  signals: OverviewCardResult<SignalItem[]>;
  updatedAt: string;
}

async function request<T>(path: string): Promise<ApiResponse<T>> {
  const response = await fetch(apiUrl(path));

  if (!response.ok) {
    throw new Error(`请求失败 (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<T>;

  if (body.code !== 0 || body.data == null) {
    throw new Error(body.message || "接口返回错误");
  }

  return body;
}

/** GET /api/etf/quote */
export async function fetchETFQuote(): Promise<{
  data: ETFQuote;
  updatedAt: string;
  stale?: boolean;
}> {
  const response = await fetch(apiUrl("/api/etf/quote"));
  const body = (await response.json()) as ApiResponse<ETFQuote> & {
    error?: boolean;
    stale?: boolean;
  };

  if (body.error === true || body.data == null) {
    throw new Error(body.message || "行情数据获取失败，请稍后重试");
  }

  return {
    data: body.data,
    updatedAt: body.updatedAt,
    stale: body.stale,
  };
}

/** GET /api/index/list */
export async function fetchIndexList(): Promise<{
  data: IndexQuote[];
  updatedAt: string;
  stale?: boolean;
}> {
  const response = await fetch(apiUrl("/api/index/list"));
  const body = (await response.json()) as ApiResponse<IndexQuote[]> & {
    error?: boolean;
    stale?: boolean;
  };

  if (body.error === true || body.data == null) {
    throw new Error(body.message || "指数数据获取失败，请稍后重试");
  }

  return {
    data: body.data,
    updatedAt: body.updatedAt,
    stale: body.stale,
  };
}

/** GET /api/fund/flow */
export async function fetchFundFlow(): Promise<{
  data: FundFlow;
  updatedAt: string;
}> {
  const body = await request<FundFlow>("/api/fund/flow");
  return { data: body.data, updatedAt: body.updatedAt };
}

/** GET /api/memory/price */
export async function fetchMemoryPrice(): Promise<{
  data: MemoryPrice[];
  updatedAt: string;
}> {
  const body = await request<MemoryPrice[]>("/api/memory/price");
  return { data: body.data, updatedAt: body.updatedAt };
}

/** GET /api/signal/board */
export async function fetchSignalBoard(): Promise<{
  data: SignalItem[];
  updatedAt: string;
}> {
  const body = await request<SignalItem[]>("/api/signal/board");
  return { data: body.data, updatedAt: body.updatedAt };
}

/** GET /api/overview — 一次获取五张卡片数据（各卡片独立容错） */
export async function fetchAllData(): Promise<AllDataResult> {
  const response = await fetch(apiUrl("/api/overview"));

  if (!response.ok) {
    throw new Error(`请求失败 (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<OverviewPayload>;

  if (body.data == null) {
    throw new Error(body.message || "接口返回错误");
  }

  return {
    etf: body.data.etf,
    indexes: body.data.indexes,
    memoryPrices: body.data.memoryPrices,
    fundFlow: body.data.fundFlow,
    signals: body.data.signals,
    updatedAt: body.updatedAt,
  };
}
