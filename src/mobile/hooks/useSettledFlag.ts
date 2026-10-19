import { useEffect, useState } from "react";

/** Follows `flag`, but only turns true after it has stayed true for `delayMs`. */
export function useSettledFlag(flag: boolean, delayMs: number): boolean {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (!flag) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), delayMs);
    return () => clearTimeout(timer);
  }, [flag, delayMs]);

  return settled;
}
