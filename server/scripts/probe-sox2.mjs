const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function tryUrl(label, url, opts = {}) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "*/*", ...opts.headers },
      ...opts,
    });
    const text = await r.text();
    console.log(`\n=== ${label} ===`);
    console.log("status:", r.status, r.statusText);
    console.log("body:", text.slice(0, 600));
    return { ok: r.ok, status: r.status, text };
  } catch (e) {
    console.log(`\n=== ${label} FAILED ===`, e.message);
    return { ok: false, error: e.message };
  }
}

await tryUrl("yahoo chart query1", "https://query1.finance.yahoo.com/v8/finance/chart/%5ESOX?interval=1d&range=1d");
await tryUrl("yahoo chart query2", "https://query2.finance.yahoo.com/v8/finance/chart/%5ESOX?interval=1d&range=1d");
await tryUrl("yahoo quote", "https://query1.finance.yahoo.com/v7/finance/quote?symbols=%5ESOX");
await tryUrl("stooq csv", "https://stooq.com/q/l/?s=^sox&f=sd2t2ohlcv&h&e=csv");
await tryUrl("stooq json", "https://stooq.com/q/d/l/?s=^sox&i=d");
await tryUrl("google finance", "https://www.google.com/finance/quote/SOX:INDEXNASDAQ");
await tryUrl(
  "eastmoney search",
  "https://searchapi.eastmoney.com/api/suggest/get?input=SOX&type=14&token=894050c76af8597a853f5b408b759f58&count=10",
);
await tryUrl(
  "eastmoney global quote SOX",
  "https://push2.eastmoney.com/api/qt/stock/get?secid=100.SOX&fields=f43,f170,f57,f58&cb=",
  { headers: { Referer: "https://www.eastmoney.com" } },
);
await tryUrl(
  "eastmoney 124.SOX",
  "https://push2.eastmoney.com/api/qt/stock/get?secid=124.SOX&fields=f43,f170,f57,f58&cb=",
  { headers: { Referer: "https://www.eastmoney.com" } },
);
await tryUrl(
  "eastmoney 105.SOX",
  "https://push2.eastmoney.com/api/qt/stock/get?secid=105.SOX&fields=f43,f170,f57,f58&cb=",
  { headers: { Referer: "https://www.eastmoney.com" } },
);
await tryUrl(
  "sina hq",
  "https://hq.sinajs.cn/list=gb_$sox",
  { headers: { Referer: "https://finance.sina.com.cn" } },
);
await tryUrl(
  "investing api",
  "https://api.investing.com/api/financialdata/8827/historical/chart/?period=P1D&interval=PT1M&pointscount=60",
  { headers: { "domain-id": "www", Origin: "https://www.investing.com" } },
);
await tryUrl("twelvedata", "https://api.twelvedata.com/price?symbol=SOX&apikey=demo");
await tryUrl("finnhub quote", "https://finnhub.io/api/v1/quote?symbol=%5ESOX&token=demo");
