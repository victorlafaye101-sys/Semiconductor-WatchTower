const h = {
  Referer: "https://data.eastmoney.com/hsgt/index.html",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

const urls = [
  // 北向资金汇总
  "https://push2delay.eastmoney.com/api/qt/kamt/get?fields1=f1,f3&fields2=f51,f52,f53,f54,f55,f56",
  // 北向资金历史
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,DEAL_AMT,DEAL_NET_AMT&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(MUTUAL_TYPE%3D%22001%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,DEAL_NET_AMT&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_MARKET_STA&columns=TRADE_DATE,MUTUAL_TYPE,NET_INFLOW&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_NORTH_NETBUY&columns=TRADE_DATE,NET_BUY_AMT&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  // ETF 份额
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARE&columns=SECURITY_CODE,SECURITY_NAME_ABBR,SHARE_CHANGE,SHARE_END,CHANGE_RATE&pageNumber=1&pageSize=5&sortColumns=SHARE_END&sortTypes=-1&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARE_DAILY&columns=SECURITY_CODE,TRADE_DATE,SHARE&pageNumber=1&pageSize=30&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_FUND_ETFSCALE&columns=SECURITY_CODE,SECURITY_NAME,SHARE_CHANGE,SHARE_END,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  // fund share history
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=etfshare&code=159813&page=1&per=30",
];

for (const u of urls) {
  try {
    const r = await fetch(u, { headers: h });
    const t = await r.text();
    console.log("\n===", u.includes("reportName") ? u.match(/reportName=([^&]+)/)?.[1] : u.slice(40, 100), "===");
    console.log(t.slice(0, 600));
  } catch (e) {
    console.log("ERR", e.message);
  }
}
