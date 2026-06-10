const BASE = "http://localhost:3001";

const MOCK = {
  etfPrice: 1.73,
  indexPrices: [12580.5, 4850.3, 1025.6],
  fundToday: -125_000_000,
  etfShare: 850_000_000,
};

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`);
  return res.json();
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

console.log("=== 1. 真实数据 + updatedAt ===");
const overview = await getJson("/api/overview?refresh=1");
const { etf, indexes, fundFlow } = overview.data;

assert(etf.ok && etf.updatedAt, "ETF 缺少 ok/updatedAt");
assert(indexes.ok && indexes.updatedAt, "指数缺少 ok/updatedAt");
assert(fundFlow.ok && fundFlow.updatedAt, "资金流向缺少 ok/updatedAt");
assert(overview.updatedAt, "overview 缺少 updatedAt");

assert(etf.data.price !== MOCK.etfPrice, `ETF 仍为 Mock 价格 ${etf.data.price}`);
assert(
  indexes.data.every((item, i) => item.price !== MOCK.indexPrices[i]),
  "指数仍为 Mock 价格",
);
assert(
  fundFlow.data.northBound.today !== MOCK.fundToday,
  "北向资金仍为 Mock",
);
assert(
  fundFlow.data.etfShare.current !== MOCK.etfShare,
  "ETF 份额仍为 Mock",
);

console.log("ETF", etf.data.price, etf.updatedAt);
console.log(
  "指数",
  indexes.data.map((x) => x.price).join(", "),
  indexes.updatedAt,
);
console.log(
  "资金",
  fundFlow.data.northBound.today,
  fundFlow.data.etfShare.current,
  fundFlow.updatedAt,
);

console.log("\n=== 2. 缓存独立：仅 ETF refresh 不影响指数/资金 ===");
const etfRefresh = await getJson("/api/etf/quote?refresh=1");
const indexCached = await getJson("/api/index/list");
const fundCached = await getJson("/api/fund/flow");
const overviewAfter = await getJson("/api/overview");

assert(
  overviewAfter.data.etf.updatedAt === etfRefresh.updatedAt,
  "overview ETF 应与 /api/etf/quote refresh 后一致",
);
assert(
  overviewAfter.data.indexes.updatedAt === indexCached.updatedAt,
  "overview 指数 updatedAt 应沿用 /api/index/list 缓存",
);
assert(
  overviewAfter.data.fundFlow.updatedAt === fundCached.updatedAt,
  "overview 资金 updatedAt 应沿用 /api/fund/flow 缓存",
);

console.log("ETF updatedAt", overviewAfter.data.etf.updatedAt);
console.log("指数 updatedAt", overviewAfter.data.indexes.updatedAt);
console.log("资金 updatedAt", overviewAfter.data.fundFlow.updatedAt);

console.log("\n=== 3. overview refresh=1 不刷新其他接口缓存 ===");
const indexBefore = await getJson("/api/index/list");
const fundBefore = await getJson("/api/fund/flow");
await getJson("/api/overview?refresh=1");
const indexAfter = await getJson("/api/index/list");
const fundAfter = await getJson("/api/fund/flow");

assert(
  indexAfter.updatedAt === indexBefore.updatedAt,
  "overview refresh 不应改变指数缓存",
);
assert(
  fundAfter.updatedAt === fundBefore.updatedAt,
  "overview refresh 不应改变资金缓存",
);

console.log("指数 updatedAt 不变", indexBefore.updatedAt);
console.log("资金 updatedAt 不变", fundBefore.updatedAt);

console.log("\n全部检查通过");
