const h = { Referer: "https://fundf10.eastmoney.com", "User-Agent": "Mozilla/5.0" };

const urls = [
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=gmbd&code=159813&page=1&per=30",
  "https://fundf10.eastmoney.com/F10DataApi.aspx?type=jjgm&code=159813&page=1&per=30",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARESCALE&columns=SECURITY_CODE,SECURITY_NAME,END_SHARE,CHANGE_SHARE,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_ETF_SHARE_SCALE&columns=SECURITY_CODE,END_SHARE,CHANGE_SHARE,CHANGE_RATE&pageNumber=1&pageSize=5&source=WEB&client=WEB&filter=(SECURITY_CODE%3D%22159813%22)",
  "https://push2delay.eastmoney.com/api/qt/clist/get?pn=1&pz=500&po=1&np=1&fltt=2&invt=2&fid=f12&fs=b:MK0021,b:MK0022,b:MK0023,b:MK0024&fields=f12,f14,f124,f184&cb=",
];

for (const u of urls) {
  const t = await (await fetch(u, { headers: h })).text();
  console.log("\n===", u.slice(30, 100), "===");
  if (u.includes("clist")) {
    const j = JSON.parse(t.replace(/^[^(]*\(|\);?$/g, ""));
    const row = j.data?.diff?.find((x) => x.f12 === "159813");
    console.log(row);
  } else {
    console.log(t.slice(0, 500));
  }
}
