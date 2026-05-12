"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { Flag } from "@/components/Flag";
import { useTournament } from "@/components/TournamentProvider";
import { phaseLabel } from "@/lib/tournament/constants";
import { getWinner } from "@/lib/tournament/matches";
import { isTournamentCompleted } from "@/lib/tournament/selectors";
import type { Match } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";

import { Network, Lock, Trophy } from "lucide-react";

export default function BracketPage() {
  const { state, simulateKnockoutRound } = useTournament();
  const bracketSides = useMemo(
    () => ({
      left: [
        ["Round of 32", splitMatches(state.r32Matches).left],
        ["Round of 16", splitMatches(state.r16Matches).left],
        ["Quarter-finals", splitMatches(state.quarterFinals).left],
        ["Semi-finals", splitMatches(state.semiFinals).left]
      ] satisfies BracketRound[],
      right: [
        ["Semi-finals", splitMatches(state.semiFinals).right],
        ["Quarter-finals", splitMatches(state.quarterFinals).right],
        ["Round of 16", splitMatches(state.r16Matches).right],
        ["Round of 32", splitMatches(state.r32Matches).right]
      ] satisfies BracketRound[]
    }),
    [state.r32Matches, state.r16Matches, state.quarterFinals, state.semiFinals]
  );
  const groupStageComplete = state.phase !== "GROUP_STAGE" && state.phase !== "NOT_STARTED";
  const nextRoundLabel = phaseLabel(state.phase);

  return (
    <main className="flex-1 pb-20">
      <header className="border-b border-glass-border bg-navy-panel/30 px-6 py-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 label-micro text-wc-red">
              <Network className="size-3" />
              <span>Phase 02</span>
            </div>
            <h1 className="font-outfit text-4xl font-black uppercase tracking-tight text-white">Knockout Stage</h1>
          </div>
          
          <div className="flex font-mono text-xs">
            <span className="border border-glass-border bg-white/5 px-4 py-2 uppercase tracking-widest text-[10px] text-white/50">
              {phaseLabel(state.phase)}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[96rem] px-4 py-12 relative 2xl:max-w-[104rem]">
        {!groupStageComplete ? (
          <div className="mx-auto flex max-w-md flex-col items-center border border-glass-border bg-white/5 p-12 text-center backdrop-blur-sm">
            <Lock className="mb-6 size-8 text-white/20" />
            <h3 className="mb-3 font-outfit text-xl font-bold uppercase tracking-widest text-white">Groups Active</h3>
            <p className="mb-8 font-mono text-xs text-white/40">Bracket generation locked until Phase 01 concludes.</p>
            <Link href="/groups" className="border border-white/20 bg-white/5 px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-navy">
              Return to Groups
            </Link>
          </div>
        ) : (
          <>
            {state.champion && (
              <section className="relative mx-auto mb-16 flex max-w-2xl flex-col items-center overflow-hidden border border-wc-red/40 bg-wc-red/5 px-12 py-16 text-center">
                <div className="absolute top-0 w-full h-1 bg-linear-to-r from-wc-blue via-wc-red to-wc-green" />
                <Trophy className="mb-6 size-12 text-wc-red" />
                <div className="mb-2 label-micro tracking-[0.3em] text-wc-red">
                  World Champion 2026
                </div>
                <h2 className="font-outfit text-5xl font-black tracking-tighter text-white">{state.champion.name}</h2>
                <Flag countryCode={state.champion.countryCode} label={state.champion.name} className="mt-8 text-7xl" />
              </section>
            )}

            <section className="overflow-x-auto pb-24">
              <div className="grid min-w-[1120px] grid-cols-[repeat(4,minmax(104px,1fr))_minmax(190px,0.85fr)_repeat(4,minmax(104px,1fr))] items-stretch gap-3 xl:min-w-0">
                {bracketSides.left.map(([title, matches], index) => (
                  <BracketRoundColumn key={`left-${title}`} title={title} matches={matches} density={index} side="left" />
                ))}

                <div className="flex min-h-[620px] flex-col justify-center gap-6 py-10">
                  <div className="border-b border-wc-red/60 pb-2 text-center font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] text-wc-red drop-shadow-sm">
                    [Final]
                  </div>
                  {state.finalMatch ? (
                    <BracketMatch match={state.finalMatch} final />
                  ) : (
                    <EmptyMatchSlot />
                  )}
                  {state.thirdPlaceMatch && (
                    <div className="pt-4">
                      <div className="mb-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                        Third Place
                      </div>
                      <BracketMatch match={state.thirdPlaceMatch} compact />
                    </div>
                  )}
                </div>

                {bracketSides.right.map(([title, matches], index) => (
                  <BracketRoundColumn key={`right-${title}`} title={title} matches={matches} density={3 - index} side="right" />
                ))}
              </div>
            </section>

            {!state.champion && (
              <div className="fixed bottom-10 left-1/2 z-40 -translate-x-1/2">
                <button 
                    className="rounded-sm border border-white/15 bg-navy-panel px-7 py-3 font-outfit text-sm font-black uppercase tracking-[0.16em] text-white/85 shadow-xl transition-colors hover:border-white/30 hover:bg-white/10 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  onClick={simulateKnockoutRound} 
                  disabled={isTournamentCompleted(state)}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
                    SIMULATE {nextRoundLabel}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

type BracketRound = [string, Match[]];

function splitMatches(matches: Match[]): { left: Match[]; right: Match[] } {
  const midpoint = Math.ceil(matches.length / 2);
  return {
    left: matches.slice(0, midpoint),
    right: matches.slice(midpoint)
  };
}

const BracketRoundColumn = memo(function BracketRoundColumn({
  title,
  matches,
  density,
  side
}: {
  title: string;
  matches: Match[];
  density: number;
  side: "left" | "right";
}) {
  const rowSpan = 2 ** (density + 1);
  const slotCount = 16 / rowSpan;

  return (
    <div className="relative grid min-h-[620px] grid-rows-[repeat(16,minmax(32px,1fr))] py-10">
      <div
        className={cn(
          "absolute -top-0 left-0 right-0 border-b pb-2 text-center font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] drop-shadow-sm",
          side === "left" ? "border-wc-blue/50 text-wc-blue" : "border-wc-green/50 text-wc-green"
        )}
      >
        [{title}]
      </div>

      {Array.from({ length: slotCount }, (_, index) => {
        const match = matches[index];

        return (
          <div
            className="z-10 flex items-center"
            key={match?.id ?? `${title}-${index}`}
            style={{
              gridRow: `${index * rowSpan + 1} / span ${rowSpan}`
            }}
          >
            {match ? <BracketMatch match={match} side={side} /> : <EmptyMatchSlot />}
          </div>
        );
      })}

      {density < 3 &&
        Array.from({ length: slotCount / 2 }, (_, index) => (
          <BracketConnector key={`${title}-connector-${index}`} density={density} index={index} side={side} />
        ))}
    </div>
  );
});

const BracketConnector = memo(function BracketConnector({
  density,
  index,
  side
}: {
  density: number;
  index: number;
  side: "left" | "right";
}) {
  const rowSpan = 2 ** (density + 2);
  const rowStart = index * rowSpan + 1;
  const lineColor = side === "left" ? "border-wc-blue/30" : "border-wc-green/30";
  const edgeClass = side === "left" ? "right-[-0.75rem]" : "left-[-0.75rem]";
  const middleClass = side === "left" ? "right-[-1.5rem]" : "left-[-1.5rem]";

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative z-0"
      style={{
        gridRow: `${rowStart} / span ${rowSpan}`
      }}
    >
      <span className={cn("absolute top-1/4 h-1/2 border-r", edgeClass, lineColor)} />
      <span className={cn("absolute top-1/4 w-3 border-t", edgeClass, lineColor)} />
      <span className={cn("absolute bottom-1/4 w-3 border-t", edgeClass, lineColor)} />
      <span className={cn("absolute top-1/2 w-3 border-t", middleClass, lineColor)} />
    </div>
  );
});

const EmptyMatchSlot = memo(function EmptyMatchSlot() {
  return <div aria-hidden="true" className="invisible h-[94px] w-full" />;
});

const BracketMatch = memo(function BracketMatch({
  match,
  final = false,
  compact = false,
  side
}: {
  match: Match;
  final?: boolean;
  compact?: boolean;
  side?: "left" | "right";
}) {
  const winner = getWinner(match);

  return (
    <article
      className={cn(
        "relative my-2 w-full overflow-visible rounded-sm border bg-navy-panel/80 backdrop-blur-sm transition-all hover:scale-[1.02] hover:border-white/20 hover:bg-navy-panel",
        final ? "border-wc-red" : "border-glass-border/40",
        side === "left" &&
          "after:absolute after:right-[-1rem] after:top-1/2 after:h-px after:w-4 after:bg-glass-border/40 after:content-['']",
        side === "right" &&
          "before:absolute before:left-[-1rem] before:top-1/2 before:h-px before:w-4 before:bg-glass-border/40 before:content-['']",
        compact && "opacity-80"
      )}
    >
      <div className={`flex justify-between gap-2 border-b px-3 py-1.5 label-micro tracking-widest ${final ? "border-wc-red/30 bg-wc-red/10 text-wc-red" : "border-glass-border/30 bg-black/40 text-white/30"}`}>
        <span>{match.matchNumber ? `M#${match.matchNumber}` : "M#"}</span>
        <span>{final ? "FINAL" : roundAbbreviation(match.knockoutRound)}</span>
      </div>
      <BracketTeam team={match.homeTeam} score={match.homeScore} played={match.played} winner={winner?.name === match.homeTeam.name} loser={match.played && winner?.name !== match.homeTeam.name} final={final} />
      <div className="h-px w-full bg-glass-border/10" />
      <BracketTeam team={match.awayTeam} score={match.awayScore} played={match.played} winner={winner?.name === match.awayTeam.name} loser={match.played && winner?.name !== match.awayTeam.name} final={final} />
    </article>
  );
});

function roundAbbreviation(round: Match["knockoutRound"]): string {
  switch (round) {
    case "ROUND_OF_32":
      return "R32";
    case "ROUND_OF_16":
      return "R16";
    case "QUARTERFINAL":
      return "QF";
    case "SEMIFINAL":
      return "SF";
    case "THIRD_PLACE":
      return "3RD";
    case "FINAL":
      return "FINAL";
    default:
      return "";
  }
}

const BracketTeam = memo(function BracketTeam({
  team,
  score,
  played,
  winner,
  loser,
  final
}: {
  team: Match["homeTeam"];
  score: number;
  played: boolean;
  winner: boolean;
  loser: boolean;
  final?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 transition-opacity ${loser ? "opacity-30 grayscale" : "opacity-100"}`}>
      <Flag countryCode={team.countryCode} label={team.name} className="text-lg" />
      <span className={`flex-1 font-mono text-sm font-black tracking-widest ${winner ? "text-white" : "text-white/60"}`}>{team.countryCode}</span>
      <span className={`min-w-6 text-right font-mono text-sm font-bold ${winner ? (final ? "text-wc-red" : "text-white") : "text-white/40"}`}>
        {played ? score : "-"}
      </span>
    </div>
  );
});
