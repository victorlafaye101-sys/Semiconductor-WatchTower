const h = { Referer: "https://quote.eastmoney.com", "User-Agent": "Mozilla/5.0" };
const u =
  "https://push2delay.eastmoney.com/api/qt/clist/get?pn=1&pz=50&po=1&np=1&fltt=2&invt=2&fid=f12&fs=b:MK0021,b:MK0022,b:MK0023,b:MK0024&fields=f12,f14,f124,f184,f185,f186&cb=";
const j = JSON.parse((await (await fetch(u, { headers: h })).text()).replace(/^[^(]*\(|\);?$/g, ""));
const row = j.data?.diff?.find((x) => x.f12 === "159813");
console.log("159813", row);

const mob =
  "https://fundmobapi.eastmoney.com/FundMNewApi/FundMNShareScale?FCODE=159813&deviceid=Wap&plat=Wap&product=EFund&version=2.0.0";
console.log("mob", await (await fetch(mob, { headers: { Referer: "https://fund.eastmoney.com" } })).text());
