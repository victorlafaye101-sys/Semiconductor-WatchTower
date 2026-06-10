export interface CardDataState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
  updatedAt: string | null;
}
