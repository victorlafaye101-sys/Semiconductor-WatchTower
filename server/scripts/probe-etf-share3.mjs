const h = { Referer: "https://quote.eastmoney.com", "User-Agent": "Mozilla/5.0" };

// 深市 ETF 列表
const u =
  "https://push2delay.eastmoney.com/api/qt/clist/get?pn=1&pz=50&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6&fields=f12,f14,f124,f184,f185,f186,f187&cb=";
const j = JSON.parse((await (await fetch(u, { headers: h })).text()).replace(/^[^(]*\(|\);?$/g, ""));
const row = j.data?.diff?.find((x) => x.f12 === "159813");
console.log("sz etf", row);

// pingzhongdata 份额
const js = await (
  await fetch("https://fund.eastmoney.com/pingzhongdata/159813.js?v=1", {
    headers: { Referer: "https://fund.eastmoney.com" },
  })
).text();
const buy = js.match(/var Data_buySedemption\s*=\s*(\{[\s\S]*?\});/);
console.log("buySed", buy?.[1]);

// fund base
const base = await (
  await fetch(
    "https://api.fund.eastmoney.com/f10/FundBaseInfo/?fundCode=159813&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0",
    { headers: { Referer: "https://fund.eastmoney.com" } },
  )
).text();
console.log("base", base.slice(0, 600));
