import { useCallback, useRef, useState } from "react";

export type SubmitPhase = "idle" | "sending" | "sent" | "error";

/**
 * Async form / action submit with guarded double-submit and stable phases.
 */
export function useSubmitPhase() {
  const inFlight = useRef(false);
  const [status, setStatus] = useState<SubmitPhase>("idle");

  const run = useCallback(async (task: () => Promise<void>): Promise<boolean> => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setStatus("sending");
    try {
      await task();
      setStatus("sent");
      return true;
    } catch {
      setStatus("error");
      return false;
    } finally {
      inFlight.current = false;
    }
  }, []);

  return { status, run };
}
