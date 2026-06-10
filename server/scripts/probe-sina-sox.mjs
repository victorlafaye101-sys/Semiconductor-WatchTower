import iconv from "iconv-lite";

const url = "https://hq.sinajs.cn/list=gb_$sox";
const r = await fetch(url, {
  headers: {
    Referer: "https://finance.sina.com.cn",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
});
const buf = Buffer.from(await r.arrayBuffer());
const text = iconv.decode(buf, "gbk");
console.log("raw:", text);
const m = text.match(/="([^"]+)"/);
if (m) {
  const fields = m[1].split(",");
  fields.forEach((f, i) => console.log(i, f));
}
