import { useEffect, useState } from "react";
import { formatRelativeUpdatedAt } from "../utils/relativeTime";

const TICK_MS = 30_000;

export function useRelativeUpdatedAt(iso: string | null | undefined): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!iso) {
      setLabel("");
      return;
    }

    const tick = () => setLabel(formatRelativeUpdatedAt(iso));
    tick();

    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, [iso]);

  return label;
}
