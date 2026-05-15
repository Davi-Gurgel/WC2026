"use client";

import { useMemo } from "react";
import {
  TeamHero,
  TeamMetricGrid,
  TeamSquadSection,
  TeamTelemetry,
} from "@/components/simulator/TeamDetailSections";
import { useTournament } from "@/components/TournamentProvider";
import { findTeamByCodeOrName, getMatchesForTeam } from "@/lib/tournament/selectors";
import type { Team } from "@/lib/types/tournament";

export function TeamDetailClient({ code, fallbackTeam }: { code: string; fallbackTeam: Team }) {
  const { state } = useTournament();
  const activeTeam = useMemo(() => findTeamByCodeOrName(state, code), [code, state]);

  const team = activeTeam ?? fallbackTeam;
  const matches = useMemo(() => getMatchesForTeam(state, team.name), [state, team.name]);

  return (
    <main className="flex-1 pb-16" style={{ background: "#fefaf0" }}>
      <TeamHero team={team} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.15fr_0.85fr]">
        <TeamSquadSection team={team} />

        <aside className="grid content-start gap-6">
          <TeamTelemetry matches={matches} />
          <TeamMetricGrid team={team} />
        </aside>
      </div>
    </main>
  );
}
