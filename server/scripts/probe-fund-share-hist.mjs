const h = { Referer: "https://fundf10.eastmoney.com", "User-Agent": "Mozilla/5.0" };
const urls = [
  "https://fund.eastmoney.com/data/FundDataPortfolio_Interface.aspx?dt=14&mc=jjfe&code=159813&page=1&size=30",
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=jjfe&code=159813&page=1&sdate=2025-04-01&edate=2026-06-07&per=30",
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=jjgm&code=159813&page=1&sdate=2025-04-01&edate=2026-06-07&per=30",
  "https://api.fund.eastmoney.com/f10/FundShareScaleInfo?fundCode=159813&pageIndex=1&pageSize=30",
];
for (const u of urls) {
  const t = await (await fetch(u, { headers: h })).text();
  console.log("\n===", u.split("?")[1] ?? u, "===");
  console.log(t.slice(0, 600));
}
