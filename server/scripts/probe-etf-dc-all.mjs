const h = { Referer: "https://data.eastmoney.com", "User-Agent": "Mozilla/5.0" };
const u =
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARES&columns=ALL&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)";
console.log(await (await fetch(u, { headers: h })).text());

const u2 =
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARES&columns=ALL&pageNumber=1&pageSize=2&source=WEB&client=WEB";
const j = await (await fetch(u2, { headers: h })).json();
if (j.result?.data?.[0]) console.log("sample keys", Object.keys(j.result.data[0]));
