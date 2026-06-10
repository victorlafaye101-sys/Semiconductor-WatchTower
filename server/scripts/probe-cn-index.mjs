import iconv from "iconv-lite";

const h = {
  Referer: "https://finance.sina.com.cn",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};
const emH = {
  Referer: "https://www.eastmoney.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

async function sina(list) {
  const url = `https://hq.sinajs.cn/list=${list}`;
  const r = await fetch(url, { headers: h });
  const text = iconv.decode(Buffer.from(await r.arrayBuffer()), "gbk");
  console.log("\nSINA", list, "=>", text.trim());
}

async function em(secid) {
  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=f43,f170,f57,f58&cb=`;
  try {
    const r = await fetch(url, { headers: emH });
    const t = await r.text();
    console.log("\nEM", secid, "status", r.status, "=>", t.slice(0, 300));
  } catch (e) {
    console.log("\nEM", secid, "ERR", e.message);
  }
}

const eastmoneyHosts = [
  "push2.eastmoney.com",
  "push2delay.eastmoney.com",
  "80.push2.eastmoney.com",
];

for (const host of eastmoneyHosts) {
  try {
    const url = `https://${host}/api/qt/stock/get?secid=0.980017&fields=f43,f170,f57,f58&cb=`;
    const r = await fetch(url, { headers: emH });
    const t = await r.text();
    console.log("HOST", host, r.status, t.slice(0, 200));
  } catch (e) {
    console.log("HOST", host, "ERR", e.message);
  }
}

await sina("s_sh000688");
await sina("s_sz980017");
await sina("sh000688");
await sina("sz980017");
await em("0.980017");
await em("1.000688");
await em("0.000688");
