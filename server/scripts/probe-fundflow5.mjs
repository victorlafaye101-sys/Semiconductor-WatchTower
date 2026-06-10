const h = {
  Referer: "https://data.eastmoney.com/hsgt/index.html",
  "User-Agent": "Mozilla/5.0",
};

// MUTUAL_TYPE 含义探测
for (const t of ["001", "003", "005", "002", "004", "006"]) {
  const u = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,MUTUAL_TYPE,NET_DEAL_AMT,DEAL_AMT,FUND_INFLOW&pageNumber=1&pageSize=6&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(MUTUAL_TYPE%3D%22${t}%22)`;
  const j = await (await fetch(u, { headers: h })).json();
  console.log("\nTYPE", t, j.result?.data?.slice(0, 3));
}

// kamt buySellAmt vs netBuyAmt - 单位
const kamt = await (
  await fetch(
    "https://push2delay.eastmoney.com/api/qt/kamt/get?fields1=f1,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65",
    { headers: h },
  )
).json();
console.log("\nhk2sh", kamt.data.hk2sh);
console.log("hk2sz", kamt.data.hk2sz);

// pingzhongdata for share
const js = await (
  await fetch("https://fund.eastmoney.com/pingzhongdata/159813.js?v=1", {
    headers: { Referer: "https://fund.eastmoney.com" },
  })
).text();
const shareMatch = js.match(/var\s+(\w*[Ss]hare\w*)\s*=\s*([^;]+)/g);
const dataMatches = js.match(/var\s+Data_\w+\s*=\s*(\[|\{)/g);
console.log("\nshare vars", shareMatch?.slice(0, 10));
console.log("data vars", dataMatches?.slice(0, 15));
// find 份额
for (const kw of ["fe", "share", "gm", "scale", "规模", "份额"]) {
  const idx = js.indexOf(kw);
  if (idx > 0) console.log(kw, js.slice(idx, idx + 80));
}

// datacenter ETF
const etfReports = [
  "RPT_ETF_SCALE",
  "RPT_ETF_SCALECHANGE",
  "RPT_ETF_DAILYSCALE",
  "RPT_FUND_ETF_DAILY",
  "RPT_MAIN_BOARD_ETF",
];
for (const r of etfReports) {
  const u = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=${r}&pageNumber=1&pageSize=3&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)`;
  const t = await (await fetch(u, { headers: h })).text();
  if (t.includes('"success":true')) console.log("\nETF HIT", r, t.slice(0, 500));
}
