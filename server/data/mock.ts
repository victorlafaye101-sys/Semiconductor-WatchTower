export const mockEtfQuote = {
  name: "半导体ETF",
  code: "159813",
  price: 1.73,
  change: -0.01,
  changePercent: -0.57,
  high: 1.745,
  low: 1.718,
  volume: 125000000,
  history30d: [1.55, 1.58, 1.62, 1.6, 1.65, 1.7, 1.72, 1.73],
  periods: {
    "5d": 11.33,
    "1m": 35.2,
    "3m": 67.42,
    "1y": 357.31,
  },
};

export const mockIndexList = [
  {
    name: "国证芯片",
    code: "980017",
    price: 12580.5,
    changePercent: 1.25,
    history30d: [11000, 11200, 11500, 11800, 12000, 12200, 12500],
  },
  {
    name: "费城半导体",
    code: "SOX",
    price: 4850.3,
    changePercent: -0.8,
    history30d: [4900, 4880, 4860, 4850, 4840, 4850, 4850],
  },
  {
    name: "科创50",
    code: "000688",
    price: 1025.6,
    changePercent: 0.45,
  },
];

export const mockMemoryPrices = [
  {
    name: "DRAM 合约价",
    period: "2026Q2",
    changePercent: 45,
    prevPeriod: "2026Q1",
    prevChangePercent: 55,
    status: "hot",
    statusLabel: "🔥 动能充足",
    source: "TrendForce",
  },
  {
    name: "NAND 合约价",
    period: "2026Q2",
    changePercent: 25,
    prevPeriod: "2026Q1",
    prevChangePercent: 33,
    status: "warning",
    statusLabel: "⚠️ 涨幅收窄",
    source: "TrendForce",
  },
];

export const mockFundFlow = {
  northBound: {
    today: -125000000,
    "5d": [80000000, -50000000, 120000000, -30000000, -125000000],
  },
  etfShare: {
    current: 850000000,
    change1m: -85000000,
    change1mPercent: -9.09,
  },
};

export const mockSignals = [
  {
    id: "memory_momentum",
    name: "存储涨价动能",
    level: "green",
    levelLabel: "🟢 充足",
    summary: "DRAM Q2 环比涨幅维持 45%",
    suggestion: "持有",
    detail:
      "Q1 涨幅 55%，Q2 预估 45%，虽然边际放缓但仍处于高景气区间。",
    triggeredAt: "2026-05-30",
  },
  {
    id: "institution_exit",
    name: "机构获利了结",
    level: "yellow",
    levelLabel: "🟡 警惕",
    summary: "ETF 份额近 1 月减少 8.5 亿份",
    suggestion: "减仓观察",
    detail: "价格持续上涨但份额缩水，说明机构可能在边拉边撤。",
    triggeredAt: "2026-05-28",
  },
];

export const mockOverview = {
  etf: mockEtfQuote,
  indexes: mockIndexList,
  memoryPrices: mockMemoryPrices,
  fundFlow: mockFundFlow,
  signals: mockSignals,
};
