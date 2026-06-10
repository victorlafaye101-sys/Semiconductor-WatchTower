/**

 * 东方财富 push2 实时行情 — 159813 半导体 ETF

 * 文档参考：公开 JSON 接口，勿解析 HTML

 */



const ETF_CODE = "159813";

/** 深市 ETF：secid = 0.{code}；沪市为 1.{code}。159813 在深交所上市 */

const ETF_SECID = `0.${ETF_CODE}`;



const EASTMONEY_FIELDS = [

  "f43", // 最新价（×1000）

  "f44", // 最高价（×1000）

  "f45", // 最低价（×1000）

  "f57", // 证券代码

  "f58", // 证券名称

  "f169", // 涨跌额（×1000）

  "f170", // 涨跌幅（×100，单位 %）

  "f171", // 振幅（×100，单位 %），仅作预留，不映射到 change

].join(",");



const EASTMONEY_HOSTS = [

  "push2.eastmoney.com",

  "push2delay.eastmoney.com",

] as const;



const REQUEST_HEADERS = {

  "User-Agent":

    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",

  Referer: "https://www.eastmoney.com",

  Accept: "application/json, text/plain, */*",

};



export interface EtfQuoteLive {

  name: string;

  code: string;

  price: number;

  changePercent: number;

  change: number;

  high: number;

  low: number;

  updatedAt: string;

}



interface EastMoneyPayload {

  rc?: number;

  data?: Record<string, string | number | null> | null;

}



/** 价格类字段（元）：东方财富以「厘」存储，需 ÷1000 */

function scalePrice(raw: number | string | null | undefined): number {

  const n = Number(raw);

  if (!Number.isFinite(n)) {

    throw new Error("东方财富价格字段无效");

  }

  return n / 1000;

}



/** 涨跌幅（%）：东方财富 ×100 存储，需 ÷100 */

function scalePercent(raw: number | string | null | undefined): number {

  const n = Number(raw);

  if (!Number.isFinite(n)) {

    throw new Error("东方财富涨跌幅字段无效");

  }

  return n / 100;

}



function parseEastMoneyBody(raw: string): EastMoneyPayload {

  const text = raw.trim();

  const start = text.indexOf("{");

  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {

    throw new Error("东方财富返回非 JSON 格式，可能被限流或拦截");

  }

  try {

    return JSON.parse(text.slice(start, end + 1)) as EastMoneyPayload;

  } catch {

    throw new Error("东方财富 JSON 解析失败");

  }

}



function mapEastMoneyData(

  data: Record<string, string | number | null>,

): EtfQuoteLive {

  // f58 → name  证券简称

  const name = String(data.f58 ?? "").trim();

  // f57 → code  证券代码

  const code = String(data.f57 ?? ETF_CODE).trim();

  // f43 → price  最新价（÷1000）

  const price = scalePrice(data.f43);

  // f170 → changePercent  涨跌幅 %（÷100）

  const changePercent = scalePercent(data.f170);

  // f169 → change  涨跌额（÷1000）

  const change = scalePrice(data.f169);

  // f44 → high  最高价（÷1000）

  const high = scalePrice(data.f44);

  // f45 → low   最低价（÷1000）

  const low = scalePrice(data.f45);



  if (!name || !code) {

    throw new Error("东方财富返回缺少证券名称或代码");

  }



  return {

    name,

    code,

    price,

    changePercent,

    change,

    high,

    low,

    updatedAt: new Date().toISOString(),

  };

}



async function requestEastMoneyEtf(

  host: (typeof EASTMONEY_HOSTS)[number],

): Promise<EtfQuoteLive> {

  const url = `https://${host}/api/qt/stock/get?secid=${ETF_SECID}&fields=${EASTMONEY_FIELDS}&cb=`;



  let response: Response;

  try {

    response = await fetch(url, { headers: REQUEST_HEADERS });

  } catch (err) {

    const detail = err instanceof Error ? err.message : String(err);

    throw new Error(`@${host} 网络请求失败：${detail}`);

  }



  const bodyText = await response.text();



  if (!response.ok) {

    throw new Error(

      `@${host} HTTP ${response.status} ${response.statusText}，响应片段：${bodyText.slice(0, 200)}`,

    );

  }



  const payload = parseEastMoneyBody(bodyText);



  if (payload.rc !== 0 || !payload.data) {

    throw new Error(

      `@${host} 业务错误：rc=${payload.rc ?? "unknown"}，data 为空`,

    );

  }



  try {

    return mapEastMoneyData(payload.data);

  } catch (err) {

    const detail = err instanceof Error ? err.message : String(err);

    throw new Error(`@${host} 字段映射失败：${detail}`);

  }

}



/**

 * 拉取 159813 ETF 实时行情（东方财富 push2）

 */

export async function fetchEtfQuoteLive(): Promise<EtfQuoteLive> {

  const errors: string[] = [];



  for (const host of EASTMONEY_HOSTS) {

    for (let attempt = 0; attempt < 2; attempt++) {

      try {

        return await requestEastMoneyEtf(host);

      } catch (err) {

        const detail = err instanceof Error ? err.message : String(err);

        errors.push(detail);

        if (attempt === 0) {

          await new Promise((resolve) => setTimeout(resolve, 200));

        }

      }

    }

  }



  throw new Error(`东方财富 API 不可用：${errors.join(" | ")}`);

}


