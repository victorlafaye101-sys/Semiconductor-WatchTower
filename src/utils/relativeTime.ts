export function formatRelativeUpdatedAt(
  iso: string,
  now = Date.now(),
): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "更新于 --";

  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 60) return `更新于 ${diffSec} 秒前`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `更新于 ${diffMin} 分钟前`;

  const diffHour = Math.floor(diffMin / 60);
  return `更新于 ${diffHour} 小时前`;
}
