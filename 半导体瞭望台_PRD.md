# 半导体瞭望台 PRD（新手友好版）

## 产品概述
一个半导体投资监控仪表盘。用户打开网页即可看到：ETF 实时行情、存储芯片价格、资金流向、买卖信号。帮助个人投资者把分散在各平台的数据聚合到一块看板，辅助买入/卖出决策。

## 目标用户
- 想跟踪半导体板块景气度的个人投资者
- 想通过一个完整项目学习全栈开发的新手

---

## 一、核心功能（MVP）

### 1. 五大监控卡片
| 卡片 | 展示内容 | 数据来源 |
|------|---------|---------|
| ETF 实时行情 | 159813 价格、涨跌幅、近5日/3月/1年涨幅、30日迷你图 | 东方财富 API（免费） |
| 指数联动 | 国证芯片 980017、费城半导体 SOX、科创 50 | 东方财富 API + Yahoo Finance（免费） |
| 产业价格燃料 | DRAM 合约价、NAND 合约价、HBM 状态 | **手动录入飞书表格**（无免费 API） |
| 资金流向 | 北向资金半导体流向、159813 基金份额变化 | 东方财富 API（免费） |
| 信号看板 | 3~5 个红绿灯信号（买入/持有/减仓/观望） | 后端规则引擎计算 |

### 2. 自动刷新
- 行情类数据每 30 秒自动轮询
- 产业价格数据每 5 分钟轮询（因为手动录入不会更频繁）
- 页面右上角显示「数据更新于 2 秒前」

### 3. 信号看板可展开
- 点击红灯/黄灯卡片，右侧滑出详情面板
- 显示：触发规则说明 + 历史触发记录 + 建议动作

---

## 二、数据流架构（新手必看）

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   前端页面    │◄────►│   后端 API   │◄────►│   数据源    │
│  (Vercel)   │  HTTP  │  (Railway)   │  抓取  │             │
└──────────────┘      └──────┬───────┘      └──────┬───────┘
                             │                      │
                    ┌────────┴────────┐    ┌──────┴──────┐
                    │  内存缓存       │    │ 东方财富 API │
                    │  (node-cache)   │    │ (ETF/指数)  │
                    │                 │    │             │
                    │  手动数据表     │    │ Yahoo Finance│
                    │  (PostgreSQL)   │    │ (SOX 指数)  │
                    └─────────────────┘    └─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  飞书多维表格      │
                    │  (手动录入存储价格) │
                    │  通过飞书 API 同步  │
                    └───────────────────┘
```

**关键说明：**
- 东方财富 API 是**公开接口，无需申请**，但可能被限流，所以后端必须加缓存
- 存储芯片价格（TrendForce）**没有免费 API**，MVP 阶段用**飞书多维表格手动录入**，后端通过飞书 API 读取
- 所有数据都经过后端中转，前端不直接请求第三方（避免跨域和被封）

---

## 三、接口设计（含 JSON 示例）

统一返回格式：
```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "updatedAt": "2026-05-30T14:32:18+08:00"
}
```

### 接口 1：ETF 实时行情
`GET /api/etf/quote?code=159813`

返回示例：
```json
{
  "code": 0,
  "data": {
    "name": "半导体ETF",
    "code": "159813",
    "price": 1.730,
    "change": -0.01,
    "changePercent": -0.57,
    "high": 1.745,
    "low": 1.718,
    "volume": 125000000,
    "history30d": [1.55, 1.58, 1.62, 1.60, 1.65, 1.70, 1.72, 1.73],
    "periods": {
      "5d": 11.33,
      "1m": 35.20,
      "3m": 67.42,
      "1y": 357.31
    }
  },
  "updatedAt": "2026-05-30T14:32:18+08:00"
}
```

### 接口 2：指数联动
`GET /api/index/quotes`

返回示例：
```json
{
  "code": 0,
  "data": [
    {
      "name": "国证芯片",
      "code": "980017",
      "price": 12580.50,
      "changePercent": 1.25,
      "history30d": [11000, 11200, 11500, 11800, 12000, 12200, 12500]
    },
    {
      "name": "费城半导体",
      "code": "SOX",
      "price": 4850.30,
      "changePercent": -0.80,
      "history30d": [4900, 4880, 4860, 4850, 4840, 4850, 4850]
    },
    {
      "name": "科创50",
      "code": "000688",
      "price": 1025.60,
      "changePercent": 0.45
    }
  ]
}
```

### 接口 3：产业价格燃料
`GET /api/memory/price`

返回示例：
```json
{
  "code": 0,
  "data": [
    {
      "name": "DRAM 合约价",
      "period": "2026Q2",
      "changePercent": 45,
      "prevPeriod": "2026Q1",
      "prevChangePercent": 55,
      "status": "hot",
      "statusLabel": "🔥 动能充足",
      "source": "TrendForce"
    },
    {
      "name": "NAND 合约价",
      "period": "2026Q2",
      "changePercent": 25,
      "prevPeriod": "2026Q1",
      "prevChangePercent": 33,
      "status": "warning",
      "statusLabel": "⚠️ 涨幅收窄",
      "source": "TrendForce"
    },
    {
      "name": "HBM3E",
      "price": "溢价 300%",
      "status": "hot",
      "statusLabel": "🔥 AI 算力核心",
      "source": "产业链调研"
    }
  ]
}
```

### 接口 4：资金流向
`GET /api/fund/flow`

返回示例：
```json
{
  "code": 0,
  "data": {
    "northBound": {
      "today": -125000000,
      "5d": [80000000, -50000000, 120000000, -30000000, -125000000]
    },
    "etfShare": {
      "current": 850000000,
      "change1m": -85000000,
      "change1mPercent": -9.09
    }
  }
}
```

### 接口 5：信号看板
`GET /api/signal/board`

返回示例：
```json
{
  "code": 0,
  "data": [
    {
      "id": "memory_momentum",
      "name": "存储涨价动能",
      "level": "green",
      "levelLabel": "🟢 充足",
      "summary": "DRAM Q2 环比涨幅维持 45%",
      "suggestion": "持有",
      "detail": "Q1 涨幅 55%，Q2 预估 45%，虽然边际放缓但仍处于高景气区间。",
      "triggeredAt": "2026-05-30"
    },
    {
      "id": "institution_exit",
      "name": "机构获利了结",
      "level": "yellow",
      "levelLabel": "🟡 警惕",
      "summary": "ETF 份额近 1 月减少 8.5 亿份",
      "suggestion": "减仓观察",
      "detail": "价格持续上涨但份额缩水，说明机构可能在边拉边撤。",
      "triggeredAt": "2026-05-28"
    }
  ]
}
```

---

## 四、信号规则引擎（伪代码，新手可直接实现）

后端用一个定时任务（node-cron）每小时跑一次，把结果写入缓存：

```javascript
// 规则 1：存储涨价动能
if (dramQ2Change >= 40) {
  signal = { level: 'green', suggestion: '买入/持有' };
} else if (dramQ2Change >= 20) {
  signal = { level: 'yellow', suggestion: '持有观察' };
} else {
  signal = { level: 'red', suggestion: '减仓' };
}

// 规则 2：机构获利了结
if (etfShareChange1m < -50000000 && priceChange5d > 10) {
  signal = { level: 'yellow', suggestion: '减仓观察' };
}

// 规则 3：美股映射断裂
if (soxChange3d < -5 && chipIndexChange3d > 5) {
  signal = { level: 'red', suggestion: '警惕回调' };
}

// 规则 4：ETF 加速冲顶
if (priceChange5d > 15 && etfShareChange1m < 0) {
  signal = { level: 'red', suggestion: '考虑减仓' };
}
```

**新手注意：** 规则先写死在后端，不要做成可配置后台。MVP 阶段改代码即可，后续再做成数据库配置。

---

## 五、缓存策略（为什么这样设计）

| 接口 | TTL | 原因 |
|------|-----|------|
| ETF 实时行情 | 30 秒 | 东方财富 API 限流约 60 秒/次，30 秒缓存平衡实时性与稳定性 |
| 指数联动 | 60 秒 | SOX 来自 Yahoo Finance，请求较慢，减少调用频率 |
| 产业价格 | 5 分钟 | 手动录入不会更频繁，且 TrendForce 是周度数据，实时性要求低 |
| 资金流向 | 5 分钟 | 北向资金是日度汇总，过于频繁无意义 |
| 信号看板 | 5 分钟 | 依赖上述数据，随动刷新 |

**降级方案：** 如果东方财富 API 返回 403/空数据，后端直接返回缓存中的上一次有效数据，并在 JSON 中增加 `"stale": true` 标记，前端显示"数据可能滞后"。

---

## 六、异常处理（具体 UI 方案）

| 场景 | 前端表现 |
|------|---------|
| 东方财富 API 限流 | 卡片显示上次缓存值，右上角出现「⚠️ 数据滞后 3 分钟」灰色标签 |
| 单接口失败 | 该卡片显示「数据获取中...」，其他卡片正常展示，页面不白屏 |
| 后端完全宕机 | 前端显示「服务维护中，请稍后刷新」，保留页面骨架 |
| 飞书表格未录入 | 产业价格卡片显示「暂无数据，等待更新」，不报错 |

---

## 七、数据源清单（标注成本与稳定性）

| 数据 | 来源 | 成本 | 稳定性 | 备注 |
|------|------|------|--------|------|
| 159813 净值/涨跌幅 | 东方财富 API | 免费 | 中（可能限流） | 公开接口，无需 key |
| 国证芯片/科创50 | 东方财富 API | 免费 | 中 | 同上 |
| 费城半导体 SOX | Yahoo Finance API | 免费 | 高 | 通过 yfinance 库或 Yahoo API |
| 北向资金 | 东方财富 API | 免费 | 中 | 日度数据 |
| ETF 份额 | 东方财富/同花顺 | 免费 | 中 | 需解析或手动录入 |
| DRAM/NAND 价格 | TrendForce | **无免费 API** | — | MVP 手动录入飞书表格 |
| HBM 价格 | 产业链调研 | 手动 | — | 手动录入 |

---

## 八、不做清单（MVP 明确不做，防止膨胀）

- ❌ 用户登录/注册系统
- ❌ 真实交易下单（仅展示，不交易）
- ❌ 股票个股行情（只到 ETF/指数层面）
- ❌ 自动抓取 TrendForce（MVP 手动录入，后续再自动化）
- ❌ 邮件/短信推送（MVP 仅网页展示，后续加飞书机器人）
- ❌ 复杂量化模型（规则引擎用 if-else，不用机器学习）
- ❌ 移动端 App（仅响应式网页）

---

## 九、新手快速启动（Step by Step）

### 方案 A：一体化全栈（推荐新手，只维护一个服务）
**技术栈：** Next.js 14 (App Router) + TypeScript + Tailwind + Vercel Postgres + Vercel Cron

**为什么推荐：** 前后端在一个仓库，部署到 Vercel 一个按钮搞定，数据库也是 Vercel 一键创建。不需要同时维护 Railway + Vercel 两个平台。

**步骤：**
1. `npx create-next-app@latest semi-watch`（选 App Router + Tailwind）
2. 在 `app/api/` 下写后端接口（Next.js API Route）
3. 用 `node-cache` 做内存缓存（无需 Redis）
4. 用 `vercel-postgres` 做数据库（免费额度够用）
5. 前端页面在 `app/page.tsx`，用 `recharts` 画图
6. `git push` 到 GitHub，Vercel 一键导入自动部署

### 方案 B：前后端分离（适合想刻意练习 Express 的）
**技术栈：** 前端 React+Vite → Vercel，后端 Express → Railway，数据库 Railway Postgres

**步骤：**
1. 前端仓库：Vite 创建 React 项目，写死 Mock 数据先跑通 UI
2. 后端仓库：Express + node-cache + axios（请求东方财富）
3. Railway 部署后端，拿到 API 域名
4. 前端替换 Mock 为真实 API 地址
5. Vercel 部署前端

---

## 十、推荐目录结构（方案 A：Next.js）

```
semi-watch/
├── app/
│   ├── api/
│   │   ├── etf/quote/route.ts          # ETF 行情接口
│   │   ├── index/quotes/route.ts       # 指数接口
│   │   ├── memory/price/route.ts       # 存储价格接口
│   │   ├── fund/flow/route.ts          # 资金流向接口
│   │   └── signal/board/route.ts       # 信号看板接口
│   ├── page.tsx                        # 主页面
│   └── layout.tsx
├── components/
│   ├── ETFCard.tsx
│   ├── IndexGrid.tsx
│   ├── PriceFuel.tsx
│   ├── FundFlow.tsx
│   └── SignalBoard.tsx
├── lib/
│   ├── cache.ts                        # node-cache 封装
│   ├── fetcher.ts                      # 东方财富请求封装
│   ├── feishu.ts                       # 飞书表格读取
│   └── signals.ts                      # 规则引擎
├── data/
│   └── mock.ts                         # 兜底 Mock 数据
├── types/
│   └── index.ts
├── .env.local                          # 环境变量（飞书 token、数据库 URL）
└── vercel.json                         # Cron 任务配置
```

---

## 十一、界面设计要求

- 整体：暗色科技风，参考 Claude.ai 首页色系（深紫灰背景 #0f172a，青绿高亮 #10b981）
- 卡片：毛玻璃效果（backdrop-blur）、细边框、悬浮微上浮
- 数字：等宽字体，涨跌幅用颜色区分（绿涨红跌，或反过来按 A 股习惯）
- 响应式：桌面端 3 列网格，移动端 1 列堆叠
- 页脚：「仅供个人投资研究 · 数据来源：东方财富/TrendForce · 非投资建议」

---

## 十二、后续可以做

- 更多产业指标：晶圆厂资本开支（台积电法说会）、设备出货额（SEAJ）
- 预警推送：飞书机器人 Webhook 推送红灯信号到手机
- 分类 Tab：存储 / 设备 / 材料 / 设计
- 历史趋势：点击指标查看近 1 年走势大图
- 数据导出：CSV 下载
- 亮色模式切换
