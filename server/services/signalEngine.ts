import type { EtfQuoteData } from "./etfLoader.js";
import type { FundFlowData } from "./fundFlow.js";
import type { MemoryPriceRow } from "./feishuMemory.js";
export interface SignalItem {
  id: string;
  name: string;
  level: "green" | "yellow" | "red" | "gray";
  levelLabel: string;
  summary: string;
  suggestion: string;
  detail: string;
  triggeredAt: string;
}

export interface SignalInputs {
  etf: EtfQuoteData | null;
  fund: FundFlowData | null;
  memory: MemoryPriceRow[] | null;
}

export interface ComputeSignalsResult {
  signals: SignalItem[];
  partialMissing: boolean;
  missingLabels: string[];
}

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatYi(value: number): string {
  const yi = value / 100_000_000;
  const abs = Math.abs(yi);
  const sign = yi >= 0 ? "" : "-";
  return `${sign}${abs.toFixed(2)} 亿`;
}

function findDramRow(memory: MemoryPriceRow[]): MemoryPriceRow | undefined {
  return memory.find((row) => /DRAM|DDR/i.test(row.name));
}

/** 规则 1：存储涨价动能 — DRAM 环比 >=40% 绿，>=20% 黄，否则红 */
function ruleMemoryMomentum(
  memory: MemoryPriceRow[] | null,
): { signal: SignalItem; missing: boolean } {
  const triggeredAt = todayLabel();

  if (!memory?.length) {
    return {
      missing: true,
      signal: {
        id: "memory_momentum",
        name: "存储涨价动能",
        level: "gray",
        levelLabel: "⚪ 数据不足",
        summary: "暂无存储价格数据",
        suggestion: "观望",
        detail: "飞书表格未录入或同步失败，请检查配置。",
        triggeredAt,
      },
    };
  }

  const dram = findDramRow(memory);
  if (!dram) {
    return {
      missing: true,
      signal: {
        id: "memory_momentum",
        name: "存储涨价动能",
        level: "gray",
        levelLabel: "⚪ 数据不足",
        summary: "未找到 DRAM/DDR 合约价行",
        suggestion: "观望",
        detail: "请在飞书表格中录入规格含 DRAM 或 DDR 的数据行。",
        triggeredAt,
      },
    };
  }

  const change = dram.changePercent;
  if (change >= 40) {
    return {
      missing: false,
      signal: {
        id: "memory_momentum",
        name: "存储涨价动能",
        level: "green",
        levelLabel: "🟢 充足",
        summary: `${dram.name} ${dram.period} 环比涨幅 ${change.toFixed(1)}%`,
        suggestion: "持有",
        detail: `${dram.prevPeriod} 环比 ${dram.prevChangePercent.toFixed(1)}%，当前 ${dram.period} 环比 ${change.toFixed(1)}%，存储涨价动能仍处高位。`,
        triggeredAt,
      },
    };
  }

  if (change >= 20) {
    return {
      missing: false,
      signal: {
        id: "memory_momentum",
        name: "存储涨价动能",
        level: "yellow",
        levelLabel: "🟡 放缓",
        summary: `${dram.name} ${dram.period} 环比涨幅 ${change.toFixed(1)}%`,
        suggestion: "持有观察",
        detail: `涨幅较前期收窄（${dram.prevPeriod} 环比 ${dram.prevChangePercent.toFixed(1)}%），动能边际减弱。`,
        triggeredAt,
      },
    };
  }

  return {
    missing: false,
    signal: {
      id: "memory_momentum",
      name: "存储涨价动能",
      level: "red",
      levelLabel: "🔴 偏弱",
      summary: `${dram.name} ${dram.period} 环比仅 ${change.toFixed(1)}%`,
      suggestion: "减仓",
      detail: `环比涨幅低于 20%，存储涨价动能不足，需警惕景气回落。`,
      triggeredAt,
    },
  };
}

/** 规则 2：机构获利了结 — 份额 1 月减少且 5 日涨幅 >10% → 黄 */
function ruleInstitutionExit(
  etf: EtfQuoteData | null,
  fund: FundFlowData | null,
): { signal: SignalItem; missing: boolean } {
  const triggeredAt = todayLabel();
  const shareChange = fund?.etfShare?.change1m;
  const priceChange5d = etf?.periods?.["5d"];

  if (shareChange == null || priceChange5d == null) {
    return {
      missing: true,
      signal: {
        id: "institution_exit",
        name: "机构获利了结",
        level: "gray",
        levelLabel: "⚪ 数据不足",
        summary: "ETF 份额或行情数据缺失",
        suggestion: "观望",
        detail: "需要 ETF 近 5 日涨幅与份额近 1 月变化才能判断。",
        triggeredAt,
      },
    };
  }

  if (shareChange < -50_000_000 && priceChange5d > 10) {
    return {
      missing: false,
      signal: {
        id: "institution_exit",
        name: "机构获利了结",
        level: "yellow",
        levelLabel: "🟡 警惕",
        summary: `ETF 份额近 1 月减少 ${formatYi(Math.abs(shareChange))}，5 日涨幅 ${priceChange5d.toFixed(1)}%`,
        suggestion: "减仓观察",
        detail: "价格持续上涨但份额缩水，可能存在边拉边撤的获利了结行为。",
        triggeredAt,
      },
    };
  }

  return {
    missing: false,
    signal: {
      id: "institution_exit",
      name: "机构获利了结",
      level: "green",
      levelLabel: "🟢 正常",
      summary:
        shareChange < 0
          ? `份额近 1 月 ${formatYi(shareChange)}，5 日涨幅 ${priceChange5d.toFixed(1)}%`
          : `份额近 1 月增加 ${formatYi(shareChange)}`,
      suggestion: "持有",
      detail: "未触发「价涨量缩」式撤离信号，资金面与价格走势暂未明显背离。",
      triggeredAt,
    },
  };
}

export function computeSignals(inputs: SignalInputs): ComputeSignalsResult {
  const results = [
    ruleMemoryMomentum(inputs.memory),
    ruleInstitutionExit(inputs.etf, inputs.fund),
  ];

  const missingLabels = results
    .filter((item) => item.missing)
    .map((item) => item.signal.name);

  return {
    signals: results.map((item) => item.signal),
    partialMissing: missingLabels.length > 0,
    missingLabels,
  };
}
