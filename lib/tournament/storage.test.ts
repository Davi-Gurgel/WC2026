import { describe, expect, it } from "vitest";
import { loadStoredTournamentState, persistTournamentState, STORAGE_KEY } from "@/lib/tournament/storage";

function createMockStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  } as Storage;
}

describe("loadStoredTournamentState", () => {
  it("returns null when storage key is missing", async () => {
    const storage = createMockStorage();
    const result = await loadStoredTournamentState(storage);
    expect(result).toBeNull();
  });

  it("removes the key and returns null for malformed JSON", async () => {
    const storage = createMockStorage({ [STORAGE_KEY]: "not-json" });
    const result = await loadStoredTournamentState(storage);
    expect(result).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("removes the key and returns null for invalid schema", async () => {
    const storage = createMockStorage({ [STORAGE_KEY]: JSON.stringify({ version: 999, state: {} }) });
    const result = await loadStoredTournamentState(storage);
    expect(result).toBeNull();
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("persistTournamentState", () => {
  it("stores a compact representation of the state", () => {
    const storage = createMockStorage();
    const state = { active: false, groups: [], allTeams: [], phase: "NOT_STARTED" as const, currentGroupMatchDay: 0, r32Matches: [], r16Matches: [], quarterFinals: [], semiFinals: [], topScorers: [], thirdPlaceMatch: null, finalMatch: null, champion: null, runnerUp: null, qualified3rd: [] };
    persistTournamentState(state, storage);
    expect(storage.getItem(STORAGE_KEY)).not.toBeNull();
  });
});
