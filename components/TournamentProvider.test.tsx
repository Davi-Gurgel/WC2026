// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { STORAGE_KEY, TournamentProvider, useTournament } from "@/components/TournamentProvider";
import { getAllTeams } from "@/lib/teams";
import { toStoredTournamentState } from "@/lib/tournament/storage-codec";
import { initializeTournament } from "@/lib/tournament/state";

describe("TournamentProvider flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("restores a valid tournament state from browser storage", async () => {
    const storedState = initializeTournament(getAllTeams());
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStoredTournamentState(storedState)));

    render(
      <TournamentProvider>
        <Harness />
      </TournamentProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("ready"));
    expect(screen.getByTestId("phase").textContent).toBe("GROUP_STAGE");
  });

  it("discards malformed tournament state from browser storage", async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, state: { phase: "GROUP_STAGE", active: true } })
    );

    render(
      <TournamentProvider>
        <Harness />
      </TournamentProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("ready"));
    expect(screen.getByTestId("phase").textContent).toBe("NOT_STARTED");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("starts, simulates groups, opens knockout flow, and reaches a champion", async () => {
    const user = userEvent.setup();
    render(
      <TournamentProvider>
        <Harness />
      </TournamentProvider>
    );

    await waitFor(() => expect(screen.getByTestId("ready").textContent).toBe("ready"));
    expect(screen.getByTestId("phase").textContent).toBe("NOT_STARTED");

    await user.click(screen.getByRole("button", { name: "start" }));
    await waitFor(() => expect(screen.getByTestId("phase").textContent).toBe("GROUP_STAGE"));
    await waitFor(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored ?? "{}") as {
        version?: number;
        state?: { allTeams?: unknown; groups?: Array<{ matches: Array<{ h: string; a: string }> }> };
      };

      expect(parsed.version).toBe(2);
      expect(parsed.state?.allTeams).toBeUndefined();
      expect(parsed.state?.groups?.[0]?.matches[0]).toMatchObject({ h: "MEX", a: "KOR" });
      expect(stored?.length ?? Number.POSITIVE_INFINITY).toBeLessThan(50_000);
    });

    await user.click(screen.getByRole("button", { name: "groups" }));
    expect(screen.getByTestId("phase").textContent).toBe("ROUND_OF_32");

    await user.click(screen.getByRole("button", { name: "knockout" }));
    expect(screen.getByTestId("phase").textContent).toBe("ROUND_OF_16");

    await user.click(screen.getByRole("button", { name: "knockout" }));
    await user.click(screen.getByRole("button", { name: "knockout" }));
    await user.click(screen.getByRole("button", { name: "knockout" }));
    await user.click(screen.getByRole("button", { name: "knockout" }));

    expect(screen.getByTestId("phase").textContent).toBe("FINISHED");
    expect(screen.getByTestId("champion").textContent).not.toBe("none");
  });
});

function Harness() {
  const { hydrated, state, startTournament, simulateAllGroups, simulateKnockoutRound } = useTournament();
  return (
    <div>
      <div data-testid="ready">{hydrated ? "ready" : "loading"}</div>
      <div data-testid="phase">{state.phase}</div>
      <div data-testid="champion">{state.champion?.name ?? "none"}</div>
      <button onClick={startTournament}>start</button>
      <button onClick={simulateAllGroups}>groups</button>
      <button onClick={simulateKnockoutRound}>knockout</button>
    </div>
  );
}
