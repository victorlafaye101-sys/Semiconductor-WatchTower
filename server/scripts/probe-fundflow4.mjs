const h = {
  Referer: "https://data.eastmoney.com/hsgt/index.html",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// 沪深港通历史图表
const urls = [
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=ALL&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,NET_DEAL_AMT,DEAL_AMT&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,NET_DEAL_AMT&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(MUTUAL_TYPE%3D%22001%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,NET_DEAL_AMT&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(MUTUAL_TYPE%3D%22005%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,NET_DEAL_AMT&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(MUTUAL_TYPE%3D%22003%22)",
  // 北向资金每日
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEALSTATISTICS&columns=TRADE_DATE,NET_DEAL_AMT&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_STATISTICS&columns=TRADE_DATE,NET_DEAL_AMT&pageNumber=1&pageSize=5&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB",
  // ETF 份额变动
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARECHANGE&columns=SECURITY_CODE,SECURITY_NAME,CHANGE_SHARE,END_SHARE,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARECHANGE&columns=SECURITY_CODE,SECURITY_NAME,CHANGE_SHARE,END_SHARE,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARE_CHANGE&columns=SECURITY_CODE,SECURITY_NAME,CHANGE_SHARE,END_SHARE,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  // push2 ETF 份额 f_share?
  "https://push2delay.eastmoney.com/api/qt/stock/get?secid=0.159813&fields=f62,f66,f69,f72,f75,f78,f81,f84,f85,f109,f110,f111,f112,f113,f114,f115,f116,f117,f118,f119,f120,f121,f122,f123,f124,f125,f126,f127,f128,f129,f130,f131,f132,f133,f134&cb=",
  // 基金规模
  "https://fund.eastmoney.com/pingzhongdata/159813.js?v=1",
];

for (const u of urls) {
  const t = await (await fetch(u, { headers: h })).text();
  const label = u.match(/reportName=([^&]+)/)?.[1] || u.slice(-40);
  if (!t.includes("报表配置不存在") && !t.includes('"result":null') && t.length > 50) {
    console.log("\n===", label, "===");
    console.log(t.slice(0, 700));
  } else if (t.includes("result")) {
    console.log("\n---", label, t.slice(0, 200));
  }
}
