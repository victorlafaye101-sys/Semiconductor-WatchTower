# 半导体瞭望台

## 项目简介

**半导体瞭望台**是一个面向个人投资者的半导体板块监控仪表盘。它将分散在东方财富、行情网站、产业研报等渠道的数据聚合到同一页面，帮助快速判断板块景气度、资金动向与买卖时机。

解决的核心问题：

- **信息分散**：ETF 行情、A 股/海外指数、北向资金、ETF 份额、存储合约价等散落在不同 App 与网站
- **更新滞后**：手动刷新多个页面效率低，难以形成统一视图
- **决策缺少参照**：缺少将行情、资金、产业价格与规则信号串联起来的看板

打开网页即可查看五张核心卡片：ETF 实时行情、指数联动、产业价格燃料、资金流向、信号看板。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| 后端 | Node.js + Express + TypeScript（`tsx` 运行） |
| 缓存 | 内存缓存（`server/utils/cache.ts`），支持 stale 降级 |

前端源码位于仓库根目录 `src/`，Vite 配置在 `client/vite.config.ts`。后端 API 位于 `server/`。

---

## 本地启动（Windows PowerShell）

### 环境要求

- [Node.js](https://nodejs.org/) 18 或更高版本（推荐 LTS）

安装后验证：

```powershell
node -v
npm -v
```

### 1. 安装依赖

在项目根目录打开 PowerShell：

```powershell
# 前端依赖
npm install

# 后端依赖
cd server
npm install
cd ..
```

### 2. 启动服务（需要两个终端）

**终端 1 — 后端 API（端口 3001）**

```powershell
cd server
npm run dev
```

看到 `Server running on http://localhost:3001` 即表示成功。

**终端 2 — 前端页面（端口 3000）**

```powershell
# 回到项目根目录
npm run dev
```

### 3. 打开浏览器

访问 **http://localhost:3000**

前端通过 Vite 代理将 `/api/*` 转发到 `http://localhost:3001`。首页调用 `GET /api/overview` 一次加载五张卡片；各卡片也可单独请求对应接口。

---

## 数据来源

| 模块 | 数据源 | 说明 |
|------|--------|------|
| ETF 行情（159813） | 东方财富 API | 免费公开接口，`push2` / `push2delay` 行情 |
| 指数联动 | 东方财富 API | 国证芯片（980017）、科创 50（000688） |
| 费城半导体 SOX | 新浪财经 | 东方财富不可用时的备用源 |
| 资金流向 | 东方财富 API | 北向资金历史 + 盘中实时；ETF 份额与近 1 月变化 |
| 存储价格 | TrendForce / 飞书表格 | 无稳定免费 API，MVP 阶段手动录入飞书多维表格（当前为 Mock 占位） |
| 信号看板 | 后端规则引擎 | 根据产业价格、资金流向等规则计算（当前为 Mock 占位） |

所有第三方数据均经后端中转，前端不直接请求外部接口，避免跨域与 Key 暴露。

---

## 缓存策略

各接口缓存**相互独立**，`?refresh=1` 仅跳过**当前接口**的缓存，不影响其他接口。

| 接口 | 缓存 Key | TTL | 说明 |
|------|----------|-----|------|
| `GET /api/etf/quote` | `etf_quote` | **30 秒** | 行情类，更新较频繁 |
| `GET /api/index/list` | `index_list` | **60 秒** | 指数按条独立缓存，单指数失败不影响其余 |
| `GET /api/fund/flow` | `fund_flow` | **5 分钟** | 北向资金 + ETF 份额 |
| `GET /api/memory/price` | `memory_price` | **5 分钟** | 手动录入数据 |
| `GET /api/signal/board` | `signal_board` | **5 分钟** | 规则计算结果 |
| `GET /api/overview` | — | 无聚合缓存 | 每次从上述各接口独立缓存组装 |

上游失败时，若存在历史缓存，接口会降级返回缓存数据并标记 `stale: true`。

强制刷新示例：

```powershell
curl.exe "http://localhost:3001/api/etf/quote?refresh=1"
curl.exe "http://localhost:3001/api/fund/flow?refresh=1"
```

---

## 主要 API

| 路径 | 说明 |
|------|------|
| `GET /api/overview` | 五张卡片数据合集 |
| `GET /api/etf/quote` | ETF 实时行情 |
| `GET /api/index/list` | 指数联动 |
| `GET /api/memory/price` | 产业价格燃料 |
| `GET /api/fund/flow` | 资金流向 |
| `GET /api/signal/board` | 信号看板 |
| `GET /api/health` | 健康检查 |

---

## 常见问题

### 端口被占用

**现象**：`EADDRINUSE: address already in use :::3001` 或 `:::3000`

**处理**：

```powershell
# 查看占用 3001 的进程
netstat -ano | findstr :3001

# 结束进程（将 <PID> 替换为最后一列数字）
taskkill /PID <PID> /F
```

3000 端口同理，将 `3001` 改为 `3000`。

### 代理不生效 / 卡片显示加载失败

1. 确认**后端已启动**（终端 1 无报错）
2. 确认前端使用 `npm run dev` 启动（会加载 `client/vite.config.ts` 中的 proxy）
3. 直接访问 http://localhost:3001/api/health ，应返回 `{"ok":true}`
4. 浏览器访问 http://localhost:3000 时，请求发往 `/api/*`，由 Vite 代理到 3001

若直接打开 `dist` 静态文件，开发代理不会生效；生产部署需配置 `VITE_API_BASE` 指向后端地址（见 `.env.example`）。

PowerShell 中请使用 `curl.exe` 而非 `curl`（后者是 `Invoke-WebRequest` 别名，行为不同）。

### Node.js 未安装或版本过低

- 从 https://nodejs.org/ 下载 **LTS** 版本安装
- 安装后**重新打开** PowerShell，再执行 `npm install`
- 若提示「无法识别 node」或「npm 不是内部命令」，检查环境变量是否包含 Node.js 安装路径

---

## 免责声明

**仅供个人投资研究，非投资建议。**

本工具展示的数据来自第三方公开接口或手动录入，不保证实时性、准确性与完整性。任何投资决策请自行判断并承担风险。
