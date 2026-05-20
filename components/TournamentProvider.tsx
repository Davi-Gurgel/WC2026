"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAllTeams } from "@/lib/teams";
import { simulateAllGroupMatchDays, simulateCurrentGroupMatchDay, simulateCurrentKnockoutRound } from "@/lib/tournament/simulation";
import { createEmptyTournamentState, initializeTournament } from "@/lib/tournament/state";
import { loadStoredTournamentState, persistTournamentState, STORAGE_KEY } from "@/lib/tournament/storage";
import type { TournamentState } from "@/lib/types/tournament";

export { STORAGE_KEY };

type TournamentContextValue = {
  state: TournamentState;
  hydrated: boolean;
  startTournament: () => void;
  resetTournament: () => void;
  simulateGroupDay: () => void;
  simulateAllGroups: () => void;
  simulateKnockoutRound: () => void;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TournamentState>(() => createEmptyTournamentState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Avoid hydrating in the same tick as render to prevent cascading update warnings.
    const hydrateTimeout = window.setTimeout(() => {
      void loadStoredTournamentState()
        .then((storedState) => {
          if (cancelled) return;
          if (storedState) setState(storedState);
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            localStorage.removeItem(STORAGE_KEY);
            console.error("Failed to load tournament state:", error);
          }
        })
        .finally(() => {
          if (!cancelled) setHydrated(true);
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(hydrateTimeout);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const persist = () => {
      try {
        persistTournamentState(state);
      } catch (error) {
        console.error("Failed to persist tournament state:", error);
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(persist, { timeout: 1000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(persist, 0);
    return () => globalThis.clearTimeout(timeoutId);
  }, [state, hydrated]);

  const startTournament = useCallback(() => {
    setState(initializeTournament(getAllTeams()));
  }, []);
  const resetTournament = useCallback(() => setState(createEmptyTournamentState()), []);
  const simulateGroupDay = useCallback(() => setState((current) => simulateCurrentGroupMatchDay(current)), []);
  const simulateAllGroups = useCallback(() => setState((current) => simulateAllGroupMatchDays(current)), []);
  const simulateKnockoutRound = useCallback(() => setState((current) => simulateCurrentKnockoutRound(current)), []);

  const value = useMemo<TournamentContextValue>(
    () => ({
      state,
      hydrated,
      startTournament,
      resetTournament,
      simulateGroupDay,
      simulateAllGroups,
      simulateKnockoutRound
    }),
    [state, hydrated, startTournament, resetTournament, simulateGroupDay, simulateAllGroups, simulateKnockoutRound]
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error("useTournament must be used inside TournamentProvider");
  return context;
}
