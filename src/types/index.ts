export interface ETFQuote {
  name: string;
  code: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  history30d: number[];
  periods: {
    "5d": number;
    "1m": number;
    "3m": number;
    "1y": number;
  };
}

export interface IndexQuote {
  name: string;
  code: string;
  price?: number;
  changePercent?: number;
  history30d?: number[];
  stale?: boolean;
  error?: boolean;
  message?: string;
}

export interface MemoryPrice {
  name: string;
  period: string;
  changePercent: number;
  prevPeriod: string;
  prevChangePercent: number | null;
  status: "hot" | "warning" | "cold";
  statusLabel: string;
  source: string;
}

export interface FundFlowNorthBound {
  today: number;
  "5d": number[];
  error?: string;
}

export interface FundFlow {
  northBound: FundFlowNorthBound;
  etfShare: {
    current: number;
    change1m: number;
    change1mPercent: number;
  };
}

export interface SignalItem {
  id: string;
  name: string;
  level: "green" | "yellow" | "red" | "gray";
  levelLabel: string;
  summary: string;
  suggestion: string;
  detail: string;
  triggeredAt: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  updatedAt: string;
  stale?: boolean;
}
