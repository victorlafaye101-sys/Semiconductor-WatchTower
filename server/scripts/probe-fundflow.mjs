const h = {
  Referer: "https://www.eastmoney.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const urls = [
  // 北向资金
  "https://push2.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f53,f54,f55,f56",
  "https://push2delay.eastmoney.com/api/qt/kamt.rtmin/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f53,f54,f55,f56",
  "https://push2.eastmoney.com/api/qt/kamtbs.rtmin/get?fields1=f1,f3&fields2=f51,f52,f53,f54,f55,f56",
  // 沪深港通历史
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_NETINFLOW&columns=TRADE_DATE,NET_INFLOW&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_STOCK_NORTH_NETINFLOW&columns=TRADE_DATE,NET_INFLOW,HOLD_MARKET_CAP&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  // ETF 份额 - fund flow related fields on stock
  "https://push2delay.eastmoney.com/api/qt/stock/get?secid=0.159813&fields=f57,f58,f84,f85,f86,f135,f136,f137,f138,f139,f140,f141,f142,f143,f144,f145,f146,f147,f148&cb=",
  // ETF fund scale
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=lsjz&code=159813&page=1&per=1",
  "https://api.fund.eastmoney.com/f10/lsjz?fundCode=159813&pageIndex=1&pageSize=1",
  // clist ETF
  "https://push2.eastmoney.com/api/qt/slist/get?secid=0.159813&fields=f1,f2,f3,f12,f13,f14,f62,f66,f69,f72,f75,f78,f81,f84,f87,f124,f184,f185,f186&cb=",
];

for (const u of urls) {
  try {
    const r = await fetch(u, { headers: h });
    const t = await r.text();
    console.log("\n===", u.slice(0, 90), "===");
    console.log("status", r.status);
    console.log(t.slice(0, 500));
  } catch (e) {
    console.log("\n=== ERR", u.slice(0, 60), e.message);
  }
}
