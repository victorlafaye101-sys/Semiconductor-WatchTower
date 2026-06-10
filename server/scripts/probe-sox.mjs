const h = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.eastmoney.com",
};

const lists = [
  "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:100+t:3&fields=f12,f14,f2,f3",
  "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:100+t:2&fields=f12,f14,f2,f3",
  "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:124+t:3&fields=f12,f14,f2,f3",
  "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=200&po=1&np=1&fltt=2&invt=2&fid=f12&fs=b:MK0010&fields=f12,f14,f2,f3",
];

for (const u of lists) {
  const t = await (await fetch(u, { headers: h })).text();
  if (t.includes("SOX") || t.includes("费城")) {
    console.log("LIST MATCH", u);
    const idx = t.indexOf("SOX");
    console.log(t.slice(Math.max(0, idx - 80), idx + 120));
  }
}

const more = ["100.DJI", "100.RUT", "100.VIX", "100.SOX", "100.XSOX", "100.SOX.X", "100.PHLX"];
for (const s of more) {
  const u = `https://push2.eastmoney.com/api/qt/stock/get?secid=${s}&fields=f43,f170,f57,f58,f59&cb=`;
  const j = await (await fetch(u, { headers: h })).text();
  if (!j.includes('"rc":100')) console.log(s, j);
}

// Eastmoney datacenter hyzs
const hy = "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_INDUSTRY_INDEX&columns=INDICATOR_CODE,INDICATOR_NAME,INDICATOR_VALUE,CHANGE_RATE&pageNumber=1&pageSize=50&sortColumns=INDICATOR_VALUE&sortTypes=-1&source=WEB&client=WEB&filter=(INDICATOR_CODE%3D%22EMI00055562%22)";
console.log("hyzs", (await (await fetch(hy, { headers: h })).text()).slice(0, 800));
