const h = { Referer: "https://quote.eastmoney.com", "User-Agent": "Mozilla/5.0" };
const p = new URLSearchParams({
  fields1: "f1,f2,f3,f4,f5,f6",
  fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f116",
  ut: "7eea3edcaed734bea9cbfc24409ed989",
  klt: "101",
  fqt: "0",
  secid: "0.159813",
  beg: "20250401",
  end: "20250607",
});
const j = await (
  await fetch(`https://push2his.eastmoney.com/api/qt/stock/kline/get?${p}`, {
    headers: h,
  })
).json();
console.log("keys", Object.keys(j.data ?? {}));
console.log("sample", j.data?.klines?.[0]);
console.log("split", j.data?.klines?.[0]?.split(",").length);
