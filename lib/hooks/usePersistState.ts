import { useState, useEffect } from "react";
import type { TournamentState } from "@/lib/types/tournament";
import type { StoredTournamentState } from "@/components/TournamentProvider";

export const STORAGE_KEY = "wc26-tournament-state-v1";
export const STORAGE_VERSION = 1;

export function usePersistState(initialStateFn: () => TournamentState, isStoredStateFn: (val: unknown) => val is StoredTournamentState) {
  const [state, setState] = useState<TournamentState>(initialStateFn);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrateTimeout = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isStoredStateFn(parsed)) {
            setState(parsed.state);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        console.error("Failed to load tournament state:", error);
      } finally {
        setHydrated(true);
      }
    }, 0);
    return () => window.clearTimeout(hydrateTimeout);
  }, [isStoredStateFn]);

  useEffect(() => {
    if (!hydrated) return;

    const payload: StoredTournamentState = { version: STORAGE_VERSION, state };
    const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(persist, { timeout: 1000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(persist, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [state, hydrated]);

  return { state, setState, hydrated };
}
