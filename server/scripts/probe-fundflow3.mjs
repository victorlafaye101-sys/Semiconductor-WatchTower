const h = {
  Referer: "https://www.eastmoney.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

// kamt get full
const kamt = await fetch(
  "https://push2delay.eastmoney.com/api/qt/kamt/get?fields1=f1,f2,f3,f4&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65",
  { headers: { ...h, Referer: "https://data.eastmoney.com/hsgt/index.html" } },
);
console.log("kamt full", await kamt.text());

// 北向历史 - 东方财富数据中心常见报表
const reports = [
  "RPT_MUTUAL_DEAL_HISTORY",
  "RPT_MUTUAL_DEAL_AMT",
  "RPT_MUTUAL_NET_DEAL_AMT",
  "RPT_MUTUAL_HSGT_NORTHSTA",
  "RPT_MUTUAL_HSGT_STA",
  "RPT_DATA_HSGT",
  "RPT_NORTH_FUNDFLOW",
  "RPT_MUTUAL_NET_DEAL",
];
for (const r of reports) {
  const u = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=${r}&pageNumber=1&pageSize=3&source=WEB&client=WEB`;
  const t = await (await fetch(u, { headers: h })).text();
  if (!t.includes("报表配置不存在") && !t.includes('"result":null')) {
    console.log("\nHIT", r, t.slice(0, 400));
  }
}

// ETF 份额 F10
const etfUrls = [
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=etfshare&code=159813&page=1&per=30",
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=etfscale&code=159813&page=1&per=30",
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=gmbd&code=159813&page=1&per=30",
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=jjfe&code=159813&page=1&per=30",
  "https://api.fund.eastmoney.com/f10/FundShareScale?fundCode=159813&pageIndex=1&pageSize=30",
  "https://api.fund.eastmoney.com/f10/FundShare?fundCode=159813&pageIndex=1&pageSize=30",
];
for (const u of etfUrls) {
  try {
    const t = await (await fetch(u, { headers: { ...h, Referer: "https://fundf10.eastmoney.com" } })).text();
    console.log("\nETF", u.split("type=")[1] || u.split("/").pop(), t.slice(0, 400));
  } catch (e) {
    console.log("ERR", e.message);
  }
}

// push2 f84 meaning - 流通股本/份额?
console.log("\nf84 test fields");
const stock = await (
  await fetch(
    "https://push2delay.eastmoney.com/api/qt/stock/get?secid=0.159813&fields=f84,f85,f86,f124,f135,f138,f141,f144,f147&cb=",
    { headers: h },
  )
).text();
console.log(stock);
