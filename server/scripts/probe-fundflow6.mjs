const h = { Referer: "https://data.eastmoney.com", "User-Agent": "Mozilla/5.0" };

// 北向 006 近5日
const north = await (
  await fetch(
    "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_MUTUAL_DEAL_HISTORY&columns=TRADE_DATE,NET_DEAL_AMT&pageNumber=1&pageSize=10&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(MUTUAL_TYPE%3D%22006%22)",
    { headers: { ...h, Referer: "https://data.eastmoney.com/hsgt/index.html" } },
  )
).json();
console.log("north 006", north.result?.data);

// ETF 份额 - 东方财富 ETF 专题
const etfUrls = [
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SCALE_DAILY&columns=SECURITY_CODE,SECURITY_NAME,TRADE_DATE,TOTAL_SHARES&pageNumber=1&pageSize=30&sortColumns=TRADE_DATE&sortTypes=-1&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SCALE&columns=SECURITY_CODE,SECURITY_NAME,TOTAL_SHARES,SHARE_CHANGE,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARES_CHANGE&columns=SECURITY_CODE,SECURITY_NAME,SHARES_CHANGE,END_SHARES,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARES&columns=SECURITY_CODE,SECURITY_NAME,SHARES,CHANGE_SHARES,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_FUND_ETF_LIST&columns=SECURITY_CODE,SECURITY_NAME,SHARES,SHARE_CHANGE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  // 基金档案
  "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNAssetAllocationNew?FCODE=159813&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
  "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?FCODE=159813&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
  "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNNBasicInformation?FCODE=159813&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
];

for (const u of etfUrls) {
  const t = await (await fetch(u, { headers: h })).text();
  const label = u.match(/reportName=([^&]+)/)?.[1] || u.split("/").pop()?.slice(0, 40);
  if (t.includes('"success":true') || t.includes('"Datas"') || t.includes('"Expansion"')) {
    console.log("\n===", label, "===");
    console.log(t.slice(0, 600));
  } else {
    console.log("---", label, t.slice(0, 120));
  }
}

// f116 可能是份额
const s = await (
  await fetch(
    "https://push2delay.eastmoney.com/api/qt/stock/get?secid=0.159813&fields=f116,f117,f84,f85,f86&cb=",
    { headers: h },
  )
).text();
console.log("\nstock fields", s);
