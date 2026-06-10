const h = { Referer: "https://data.eastmoney.com", "User-Agent": "Mozilla/5.0" };
const reports = [
  "RPT_ETF_SHARE_DAILY",
  "RPT_ETF_DAILY_SHARE",
  "RPT_ETF_SHARES_DAILY",
  "RPT_FUND_ETF_SHARE",
  "RPT_ETF_SHARE_INFO",
  "RPT_ETF_CHANGESCALE",
  "RPT_ETF_SCALE_CHANGE",
];
for (const r of reports) {
  const u = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=${r}&pageNumber=1&pageSize=3&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)`;
  const t = await (await fetch(u, { headers: h })).text();
  if (t.includes('"success":true')) {
    console.log("HIT", r, t.slice(0, 500));
  }
}
