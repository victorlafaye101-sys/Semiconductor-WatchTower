export interface CardDataState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  updatedAt: string | null;
  /** 示例数据或上游降级时的说明 */
  hint?: string | null;
  stale?: boolean;
}
