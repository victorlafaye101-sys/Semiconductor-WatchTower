const h = { Referer: "https://quote.eastmoney.com", "User-Agent": "Mozilla/5.0" };
const fields =
  "f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f20,f21,f23,f24,f25,f22,f11,f30,f31,f32,f33,f34,f35,f38,f62,f63,f64,f65,f66,f69,f72,f75,f78,f81,f84,f87,f115,f124,f128,f136,f152,f184,f297,f402,f441";
const params = new URLSearchParams({
  pn: "10",
  pz: "100",
  po: "1",
  np: "1",
  ut: "bd1d9ddb04089700cf9c27f6f7426281",
  fltt: "2",
  invt: "2",
  wbp2u: "|0|0|0|web",
  fid: "f12",
  fs: "b:MK0021,b:MK0022,b:MK0023,b:MK0024,b:MK0827",
  fields,
});
const j = await (
  await fetch(`https://push2delay.eastmoney.com/api/qt/clist/get?${params}`, {
    headers: h,
  })
).json();
const row = j.data?.diff?.find((x) => x.f12 === "159813");
console.log(JSON.stringify(row, null, 2));
