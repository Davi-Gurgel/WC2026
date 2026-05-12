import { expandCompactTournamentState, toStoredTournamentState } from "@/lib/tournament/storage-codec";
import { isStoredTournamentState } from "@/lib/tournament/storage-guards";
import { LEGACY_STORAGE_VERSION, STORAGE_KEY } from "@/lib/tournament/storage-schema";
import type { TournamentState } from "@/lib/types/tournament";

export { STORAGE_KEY };

export async function loadStoredTournamentState(storage: Storage = localStorage): Promise<TournamentState | null> {
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }

  if (!isStoredTournamentState(parsed)) {
    storage.removeItem(STORAGE_KEY);
    return null;
  }

  if (parsed.version === LEGACY_STORAGE_VERSION) {
    return parsed.state;
  }

  const { getAllTeams } = await import("@/lib/teams");
  return expandCompactTournamentState(parsed.state, getAllTeams());
}

export function persistTournamentState(state: TournamentState, storage: Storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(toStoredTournamentState(state)));
}
