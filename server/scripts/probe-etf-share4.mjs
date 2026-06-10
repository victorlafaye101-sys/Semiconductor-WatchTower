const h = {
  Referer: "https://quote.eastmoney.com",
  "User-Agent": "Mozilla/5.0",
};

const params = new URLSearchParams({
  pn: "1",
  pz: "100",
  po: "1",
  np: "1",
  ut: "bd1d9ddb04089700cf9c27f6f7426281",
  fltt: "2",
  invt: "2",
  wbp2u: "|0|0|0|web",
  fid: "f12",
  fs: "b:MK0021,b:MK0022,b:MK0023,b:MK0024,b:MK0827",
  fields: "f12,f14,f38,f297",
});
const clist = await (
  await fetch(`https://push2delay.eastmoney.com/api/qt/clist/get?${params}`, {
    headers: h,
  })
).json();
let row = clist.data?.diff?.find((x) => x.f12 === "159813");
console.log("page1", row);

// paginate if needed
if (!row) {
  for (let pn = 2; pn <= 20; pn++) {
    params.set("pn", String(pn));
    const j = await (
      await fetch(`https://push2delay.eastmoney.com/api/qt/clist/get?${params}`, {
        headers: h,
      })
    ).json();
    row = j.data?.diff?.find((x) => x.f12 === "159813");
    if (row) {
      console.log("page", pn, row);
      break;
    }
  }
}

// kline f116 历史份额
const kparams = new URLSearchParams({
  fields1: "f1,f2,f3,f4,f5,f6",
  fields2: "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f116",
  ut: "7eea3edcaed734bea9cbfc24409ed989",
  klt: "101",
  fqt: "0",
  secid: "0.159813",
  beg: "20250401",
  end: "20260607",
});
const kline = await (
  await fetch(`https://push2his.eastmoney.com/api/qt/stock/kline/get?${kparams}`, {
    headers: h,
  })
).json();
const lines = kline.data?.klines ?? [];
console.log("kline count", lines.length);
console.log("last 3", lines.slice(-3));
console.log("~1m ago", lines[Math.max(0, lines.length - 22)]);
