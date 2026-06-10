import { useRelativeUpdatedAt } from "../hooks/useRelativeUpdatedAt";

interface UpdatedAtFooterProps {
  updatedAt: string | null | undefined;
  className?: string;
}

export default function UpdatedAtFooter({
  updatedAt,
  className = "",
}: UpdatedAtFooterProps) {
  const label = useRelativeUpdatedAt(updatedAt);

  if (!label) return null;

  return (
    <p
      className={`mt-auto border-t border-slate-700/50 pt-3 text-xs text-slate-500 ${className}`}
    >
      {label}
    </p>
  );
}
