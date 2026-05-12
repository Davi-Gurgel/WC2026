"use client";

import Link from "next/link";
import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Flag } from "@/components/Flag";
import { useTournament } from "@/components/TournamentProvider";
import { phaseLabel } from "@/lib/tournament/constants";
import { getWinner } from "@/lib/tournament/matches";
import { isTournamentCompleted } from "@/lib/tournament/selectors";
import type { Match } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";

import { Network, Lock, Trophy } from "lucide-react";

type BracketSide = "left" | "right";

type MatchRect = {
  left: number;
  right: number;
  centerY: number;
};

type ConnectorPath = {
  id: string;
  path: string;
  side: BracketSide;
};

type ConnectorRoundSets = {
  left: Match[][];
  right: Match[][];
};

export default function BracketPage() {
  const { state, simulateKnockoutRound } = useTournament();
  const bracketContainerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [connectorPaths, setConnectorPaths] = useState<ConnectorPath[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
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
  const connectorRounds = useMemo<ConnectorRoundSets>(() => {
    const r32 = splitMatches(state.r32Matches);
    const r16 = splitMatches(state.r16Matches);
    const quarterFinals = splitMatches(state.quarterFinals);
    const semiFinals = splitMatches(state.semiFinals);

    return {
      left: [r32.left, r16.left, quarterFinals.left, semiFinals.left],
      right: [r32.right, r16.right, quarterFinals.right, semiFinals.right]
    };
  }, [state.r32Matches, state.r16Matches, state.quarterFinals, state.semiFinals]);
  const groupStageComplete = state.phase !== "GROUP_STAGE" && state.phase !== "NOT_STARTED";
  const nextRoundLabel = phaseLabel(state.phase);
  const registerMatchRef = useCallback((matchId: string, node: HTMLElement | null) => {
    if (node) {
      matchRefs.current.set(matchId, node);
      return;
    }

    matchRefs.current.delete(matchId);
  }, []);

  const updateConnectorGeometry = useCallback(() => {
    if (!groupStageComplete) {
      setConnectorPaths([]);
      return;
    }

    const container = bracketContainerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const nextSize = {
      width: containerRect.width,
      height: containerRect.height
    };
    const rectByMatchId = new Map<string, MatchRect>();

    for (const [matchId, node] of matchRefs.current) {
      const rect = node.getBoundingClientRect();
      const centerY = rect.top - containerRect.top + rect.height / 2;
      rectByMatchId.set(matchId, {
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        centerY
      });
    }

    const nextPaths: ConnectorPath[] = [];

    const addRoundConnectorPaths = (rounds: Match[][], side: BracketSide) => {
      for (let level = 0; level < rounds.length - 1; level += 1) {
        const childRound = rounds[level];
        const parentRound = rounds[level + 1];

        for (let parentIndex = 0; parentIndex < parentRound.length; parentIndex += 1) {
          const parentMatch = parentRound[parentIndex];
          const childAMatch = childRound[parentIndex * 2];
          const childBMatch = childRound[parentIndex * 2 + 1];
          if (!parentMatch || !childAMatch || !childBMatch) continue;

          const parentRect = rectByMatchId.get(parentMatch.id);
          const childARect = rectByMatchId.get(childAMatch.id);
          const childBRect = rectByMatchId.get(childBMatch.id);
          if (!parentRect || !childARect || !childBRect) continue;

          nextPaths.push({
            id: `${side}-${parentMatch.id}-${childAMatch.id}-${childBMatch.id}`,
            side,
            path: getConnectorPath(parentRect, childARect, childBRect, side)
          });
        }
      }
    };

    addRoundConnectorPaths(connectorRounds.left, "left");
    addRoundConnectorPaths(connectorRounds.right, "right");

    const finalMatch = state.finalMatch;
    const finalRect = finalMatch ? rectByMatchId.get(finalMatch.id) : undefined;
    const leftSemiFinalMatch = connectorRounds.left.at(-1)?.[0];
    const rightSemiFinalMatch = connectorRounds.right.at(-1)?.[0];
    const leftSemiFinalRect = leftSemiFinalMatch ? rectByMatchId.get(leftSemiFinalMatch.id) : undefined;
    const rightSemiFinalRect = rightSemiFinalMatch ? rectByMatchId.get(rightSemiFinalMatch.id) : undefined;

    if (finalMatch && finalRect && leftSemiFinalMatch && leftSemiFinalRect) {
      nextPaths.push({
        id: `left-${finalMatch.id}-${leftSemiFinalMatch.id}`,
        side: "left",
        path: getFinalConnectorPath(finalRect, leftSemiFinalRect, "left")
      });
    }

    if (finalMatch && finalRect && rightSemiFinalMatch && rightSemiFinalRect) {
      nextPaths.push({
        id: `right-${finalMatch.id}-${rightSemiFinalMatch.id}`,
        side: "right",
        path: getFinalConnectorPath(finalRect, rightSemiFinalRect, "right")
      });
    }

    setSvgSize((previous) =>
      previous.width === nextSize.width && previous.height === nextSize.height ? previous : nextSize
    );
    setConnectorPaths(nextPaths);
  }, [connectorRounds.left, connectorRounds.right, groupStageComplete, state.finalMatch]);

  useLayoutEffect(() => {
    const container = bracketContainerRef.current;
    if (!container || !groupStageComplete) return;

    let animationFrame = 0;
    const schedule = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(updateConnectorGeometry);
    };

    schedule();

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            schedule();
          });

    observer?.observe(container);
    for (const node of matchRefs.current.values()) {
      observer?.observe(node);
    }

    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [groupStageComplete, updateConnectorGeometry]);

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
              <div ref={bracketContainerRef} className="relative min-w-[1340px] 2xl:min-w-0">
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0"
                  width={svgSize.width}
                  height={svgSize.height}
                  viewBox={`0 0 ${svgSize.width} ${svgSize.height}`}
                >
                  {connectorPaths.map((connector) => (
                    <path
                      key={connector.id}
                      d={connector.path}
                      fill="none"
                      stroke={connector.side === "left" ? "var(--color-wc-blue)" : "var(--color-wc-green)"}
                      strokeOpacity={0.75}
                      strokeWidth={1.75}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>

                <div className="relative z-10 grid grid-cols-[repeat(4,minmax(112px,1fr))_minmax(200px,0.85fr)_repeat(4,minmax(112px,1fr))] items-stretch gap-x-8 gap-y-3">
                  {bracketSides.left.map(([title, matches], index) => (
                    <BracketRoundColumn
                      key={`left-${title}`}
                      title={title}
                      matches={matches}
                      density={index}
                      side="left"
                      onMatchRef={registerMatchRef}
                    />
                  ))}

                  <div className="relative z-10 grid min-h-[620px] grid-rows-[1fr_auto_auto_1fr] py-10">
                    <div className="row-start-2">
                      <div className="mb-6 border-b border-wc-red/60 pb-2 text-center font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] text-wc-red drop-shadow-sm">
                        [Final]
                      </div>
                      {state.finalMatch ? (
                        <BracketMatch match={state.finalMatch} final onMatchRef={registerMatchRef} />
                      ) : (
                        <EmptyMatchSlot />
                      )}
                    </div>
                    <div className="row-start-3 mt-10">
                      <div className="mb-3 text-center font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                        Third Place
                      </div>
                      {state.thirdPlaceMatch ? (
                        <BracketMatch match={state.thirdPlaceMatch} compact onMatchRef={registerMatchRef} />
                      ) : (
                        <EmptyMatchSlot />
                      )}
                    </div>
                  </div>

                  {bracketSides.right.map(([title, matches], index) => (
                    <BracketRoundColumn
                      key={`right-${title}`}
                      title={title}
                      matches={matches}
                      density={3 - index}
                      side="right"
                      onMatchRef={registerMatchRef}
                    />
                  ))}
                </div>
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
  side,
  onMatchRef
}: {
  title: string;
  matches: Match[];
  density: number;
  side: BracketSide;
  onMatchRef: (matchId: string, node: HTMLElement | null) => void;
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
            {match ? <BracketMatch match={match} onMatchRef={onMatchRef} /> : <EmptyMatchSlot />}
          </div>
        );
      })}
    </div>
  );
});

const EmptyMatchSlot = memo(function EmptyMatchSlot() {
  return (
    <article
      aria-hidden="true"
      className="relative z-10 my-2 w-full overflow-visible rounded-sm border border-glass-border/25 bg-navy-panel/35 opacity-60 backdrop-blur-sm"
    >
      <div className="flex justify-between gap-2 border-b border-glass-border/20 bg-black/25 px-3 py-1.5 label-micro tracking-widest text-white/20">
        <span>M#</span>
        <span>TBD</span>
      </div>
      <PlaceholderTeam />
      <div className="h-px w-full bg-glass-border/10" />
      <PlaceholderTeam />
    </article>
  );
});

const PlaceholderTeam = memo(function PlaceholderTeam() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="inline-block aspect-[4/3] h-[1.125rem] rounded-sm border border-white/10 bg-white/5" />
      <span className="flex-1 font-mono text-sm font-black tracking-widest text-white/25">
        TBD
      </span>
      <span className="min-w-6 text-right font-mono text-sm font-bold text-white/20">
        -
      </span>
    </div>
  );
});

const BracketMatch = memo(function BracketMatch({
  match,
  final = false,
  compact = false,
  onMatchRef
}: {
  match: Match;
  final?: boolean;
  compact?: boolean;
  onMatchRef?: (matchId: string, node: HTMLElement | null) => void;
}) {
  const winner = getWinner(match);

  return (
    <article
      data-match-id={match.id}
      ref={(node) => {
        onMatchRef?.(match.id, node);
      }}
      className={cn(
        "relative z-10 my-2 w-full overflow-visible rounded-sm border bg-navy-panel/80 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-navy-panel",
        final ? "border-wc-red" : "border-glass-border/40",
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

function getConnectorPath(parentRect: MatchRect, childARect: MatchRect, childBRect: MatchRect, side: BracketSide): string {
  const dir = side === "left" ? 1 : -1;

  const childAEdgeX = side === "left" ? childARect.right : childARect.left;
  const childBEdgeX = side === "left" ? childBRect.right : childBRect.left;
  const parentEdgeX = side === "left" ? parentRect.left : parentRect.right;

  const averageChildEdgeX = (childAEdgeX + childBEdgeX) / 2;
  const joinX = averageChildEdgeX + dir * Math.abs(parentEdgeX - averageChildEdgeX) * 0.5;

  const childAY = childARect.centerY;
  const childBY = childBRect.centerY;
  const parentY = parentRect.centerY;

  const verticalTop = Math.min(childAY, childBY, parentY);
  const verticalBottom = Math.max(childAY, childBY, parentY);

  return [
    `M ${childAEdgeX} ${childAY} H ${joinX}`,
    `M ${childBEdgeX} ${childBY} H ${joinX}`,
    `M ${joinX} ${verticalTop} V ${verticalBottom}`,
    `M ${joinX} ${parentY} H ${parentEdgeX}`
  ].join(" ");
}

function getFinalConnectorPath(parentRect: MatchRect, childRect: MatchRect, side: BracketSide): string {
  const dir = side === "left" ? 1 : -1;
  const childEdgeX = side === "left" ? childRect.right : childRect.left;
  const parentEdgeX = side === "left" ? parentRect.left : parentRect.right;
  const joinX = childEdgeX + dir * Math.abs(parentEdgeX - childEdgeX) * 0.5;

  const childY = childRect.centerY;
  const parentY = parentRect.centerY;
  const verticalTop = Math.min(childY, parentY);
  const verticalBottom = Math.max(childY, parentY);

  return [
    `M ${childEdgeX} ${childY} H ${joinX}`,
    `M ${joinX} ${verticalTop} V ${verticalBottom}`,
    `M ${joinX} ${parentY} H ${parentEdgeX}`
  ].join(" ");
}

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
    <div
      data-winner={winner ? "true" : "false"}
      className={`flex items-center gap-2 px-3 py-2 transition-opacity ${loser ? "opacity-30 grayscale" : "opacity-100"}`}
    >
      <Flag countryCode={team.countryCode} label={team.name} className="text-lg" />
      <span className={`flex-1 font-mono text-sm font-black tracking-widest ${winner ? "text-white" : "text-white/60"}`}>{team.countryCode}</span>
      <span className={`min-w-6 text-right font-mono text-sm font-bold ${winner ? (final ? "text-wc-red" : "text-white") : "text-white/40"}`}>
        {played ? score : "-"}
      </span>
    </div>
  );
});
