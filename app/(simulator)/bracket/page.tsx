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

const EYEBROW: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains-mono)",
  fontSize: "10px",
  letterSpacing: "0.24em",
  color: "#0d0d10",
  opacity: 0.55,
};

const H1: React.CSSProperties = {
  fontFamily: "var(--font-archivo-black)",
  fontSize: "clamp(36px, 5vw, 56px)",
  lineHeight: 1,
  letterSpacing: "-0.03em",
  color: "#0d0d10",
};

const SIDE_STROKE = {
  left: "#002868",
  right: "#006847",
} satisfies Record<BracketSide, string>;

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
        ["Semi-finals", splitMatches(state.semiFinals).left],
      ] satisfies BracketRound[],
      right: [
        ["Semi-finals", splitMatches(state.semiFinals).right],
        ["Quarter-finals", splitMatches(state.quarterFinals).right],
        ["Round of 16", splitMatches(state.r16Matches).right],
        ["Round of 32", splitMatches(state.r32Matches).right],
      ] satisfies BracketRound[],
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
      right: [r32.right, r16.right, quarterFinals.right, semiFinals.right],
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
    const nextSize = { width: containerRect.width, height: containerRect.height };
    const rectByMatchId = new Map<string, MatchRect>();

    for (const [matchId, node] of matchRefs.current) {
      const rect = node.getBoundingClientRect();
      const centerY = rect.top - containerRect.top + rect.height / 2;
      rectByMatchId.set(matchId, {
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        centerY,
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
            path: getConnectorPath(parentRect, childARect, childBRect, side),
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
        path: getFinalConnectorPath(finalRect, leftSemiFinalRect, "left"),
      });
    }

    if (finalMatch && finalRect && rightSemiFinalMatch && rightSemiFinalRect) {
      nextPaths.push({
        id: `right-${finalMatch.id}-${rightSemiFinalMatch.id}`,
        side: "right",
        path: getFinalConnectorPath(finalRect, rightSemiFinalRect, "right"),
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
    <main className="flex-1 pb-24" style={{ background: "#fefaf0" }}>
      <header
        className="px-4 py-7 sm:px-6 sm:py-8"
        style={{ background: "#fefaf0", borderBottom: "3px solid #0d0d10" }}
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div style={EYEBROW}>PHASE · 02</div>
            <h1 className="mt-2" style={H1}>
              KNOCKOUT STAGE
            </h1>
          </div>
          <span
            className="self-start md:self-auto"
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.22em",
              padding: "5px 10px",
              border: "1px solid #0d0d10",
              background: "#fefaf0",
              color: "#0d0d10",
            }}
          >
            {phaseLabel(state.phase).toUpperCase()}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[104rem] px-4 py-8 sm:px-6">
        {!groupStageComplete ? (
          <div
            className="mx-auto w-full max-w-md text-center"
            style={{
              background: "#fff",
              border: "3px solid #0d0d10",
              boxShadow: "8px 8px 0 0 #D52B1E",
              padding: "32px 28px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10px",
                letterSpacing: "0.24em",
                color: "#D52B1E",
                marginBottom: "12px",
              }}
            >
              LOCKED
            </div>
            <h3
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "26px",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#0d0d10",
                marginBottom: "12px",
              }}
            >
              GROUPS ACTIVE
            </h3>
            <p
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "14px",
                lineHeight: 1.55,
                color: "#0d0d10",
                opacity: 0.6,
                marginBottom: "22px",
              }}
            >
              Bracket generation unlocks when Phase 01 concludes.
            </p>
            <Link
              href="/groups"
              className="inline-flex items-center transition-transform hover:-translate-y-0.5"
              style={{
                background: "#0d0d10",
                color: "#fff",
                fontFamily: "var(--font-archivo-black)",
                fontSize: "14px",
                letterSpacing: "0.04em",
                border: "none",
                padding: "12px 22px",
                boxShadow: "4px 4px 0 0 #D52B1E",
                transitionDuration: "120ms",
              }}
            >
              RETURN TO GROUPS
            </Link>
          </div>
        ) : (
          <>
            {state.champion && (
              <section
                className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center"
                style={{
                  background: "#fff",
                  border: "3px solid #0d0d10",
                  boxShadow: "8px 8px 0 0 #D52B1E",
                  padding: "32px 28px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    color: "#D52B1E",
                    marginBottom: "10px",
                  }}
                >
                  WORLD CHAMPION 2026
                </div>
                <h2
                  className="break-words"
                  style={{
                    fontFamily: "var(--font-archivo-black)",
                    fontSize: "clamp(36px, 6vw, 64px)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    color: "#0d0d10",
                  }}
                >
                  {state.champion.name.toUpperCase()}
                </h2>
                <Flag
                  countryCode={state.champion.countryCode}
                  label={state.champion.name}
                  className="mt-6 text-6xl"
                />
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
                      stroke={SIDE_STROKE[connector.side]}
                      strokeOpacity={0.45}
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>

                <div className="relative z-10 grid grid-cols-[repeat(4,minmax(120px,1fr))_minmax(210px,0.95fr)_repeat(4,minmax(120px,1fr))] items-stretch gap-x-8 gap-y-3">
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

                  <div className="relative z-10 grid min-h-[640px] grid-rows-[1fr_auto_auto_1fr] py-10">
                    <div className="row-start-2">
                      <div
                        className="mb-5 text-center"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "11px",
                          letterSpacing: "0.3em",
                          color: "#D52B1E",
                          borderBottom: "2px solid #D52B1E",
                          paddingBottom: "6px",
                        }}
                      >
                        FINAL
                      </div>
                      {state.finalMatch ? (
                        <BracketMatch match={state.finalMatch} final onMatchRef={registerMatchRef} />
                      ) : (
                        <EmptyMatchSlot />
                      )}
                    </div>
                    <div className="row-start-3 mt-8">
                      <div
                        className="mb-3 text-center"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.24em",
                          color: "#0d0d10",
                          opacity: 0.45,
                        }}
                      >
                        THIRD PLACE
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
              <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
                <button
                  type="button"
                  onClick={simulateKnockoutRound}
                  disabled={isTournamentCompleted(state)}
                  className="transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background: "#0d0d10",
                    color: "#fff",
                    fontFamily: "var(--font-archivo-black)",
                    fontSize: "14px",
                    letterSpacing: "0.04em",
                    border: "none",
                    padding: "14px 26px",
                    cursor: "pointer",
                    boxShadow: "6px 6px 0 0 #D52B1E",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                    transitionDuration: "120ms",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block animate-pulse"
                    style={{ width: 8, height: 8, background: "#D52B1E" }}
                  />
                  SIMULATE {nextRoundLabel.toUpperCase()}
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
    right: matches.slice(midpoint),
  };
}

const BracketRoundColumn = memo(function BracketRoundColumn({
  title,
  matches,
  density,
  side,
  onMatchRef,
}: {
  title: string;
  matches: Match[];
  density: number;
  side: BracketSide;
  onMatchRef: (matchId: string, node: HTMLElement | null) => void;
}) {
  const rowSpan = 2 ** (density + 1);
  const slotCount = 16 / rowSpan;
  const accent = SIDE_STROKE[side];

  return (
    <div className="relative grid min-h-[640px] grid-rows-[repeat(16,minmax(32px,1fr))] py-10">
      <div
        className="absolute left-0 right-0 top-0 text-center"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "10px",
          letterSpacing: "0.24em",
          color: accent,
          borderBottom: `2px solid ${accent}`,
          paddingBottom: "6px",
        }}
      >
        {title.toUpperCase()}
      </div>

      {Array.from({ length: slotCount }, (_, index) => {
        const match = matches[index];

        return (
          <div
            className="z-10 flex items-center"
            key={match?.id ?? `${title}-${index}`}
            style={{ gridRow: `${index * rowSpan + 1} / span ${rowSpan}` }}
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
      className="relative z-10 my-2 w-full"
      style={{
        background: "#fefaf0",
        border: "2px dashed rgba(13,13,16,0.25)",
      }}
    >
      <div
        className="flex justify-between gap-2"
        style={{
          background: "rgba(13,13,16,0.04)",
          borderBottom: "1px dashed rgba(13,13,16,0.2)",
          padding: "4px 8px",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "9px",
          letterSpacing: "0.2em",
          color: "rgba(13,13,16,0.4)",
        }}
      >
        <span>M#</span>
        <span>TBD</span>
      </div>
      <PlaceholderTeam />
      <div style={{ height: 1, background: "rgba(13,13,16,0.1)" }} />
      <PlaceholderTeam />
    </article>
  );
});

const PlaceholderTeam = memo(function PlaceholderTeam() {
  return (
    <div className="flex items-center gap-2" style={{ padding: "6px 8px" }}>
      <span
        aria-hidden="true"
        className="inline-block aspect-[4/3] shrink-0"
        style={{ height: "14px", background: "rgba(13,13,16,0.08)" }}
      />
      <span
        className="flex-1"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "12px",
          letterSpacing: "0.06em",
          color: "rgba(13,13,16,0.3)",
        }}
      >
        TBD
      </span>
      <span
        className="min-w-6 text-right"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "12px",
          color: "rgba(13,13,16,0.25)",
        }}
      >
        -
      </span>
    </div>
  );
});

const BracketMatch = memo(function BracketMatch({
  match,
  final = false,
  compact = false,
  onMatchRef,
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
        "relative z-10 my-2 w-full transition-transform hover:-translate-y-0.5",
        compact && "opacity-90"
      )}
      style={{
        background: "#fff",
        border: final ? "2px solid #D52B1E" : "2px solid #0d0d10",
        boxShadow: final ? "4px 4px 0 0 #D52B1E" : "none",
        transitionDuration: "120ms",
      }}
    >
      <div
        className="flex justify-between gap-2"
        style={{
          background: final ? "#D52B1E" : "#0d0d10",
          color: "#fff",
          padding: "4px 8px",
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "9px",
          letterSpacing: "0.2em",
        }}
      >
        <span style={{ opacity: 0.75 }}>{match.matchNumber ? `M#${match.matchNumber}` : "M#"}</span>
        <span>{final ? "FINAL" : roundAbbreviation(match.knockoutRound)}</span>
      </div>
      <BracketTeam
        team={match.homeTeam}
        score={match.homeScore}
        played={match.played}
        winner={winner?.name === match.homeTeam.name}
        loser={match.played && winner?.name !== match.homeTeam.name}
        final={final}
      />
      <div style={{ height: 1, background: "rgba(13,13,16,0.12)" }} />
      <BracketTeam
        team={match.awayTeam}
        score={match.awayScore}
        played={match.played}
        winner={winner?.name === match.awayTeam.name}
        loser={match.played && winner?.name !== match.awayTeam.name}
        final={final}
      />
    </article>
  );
});

function getConnectorPath(
  parentRect: MatchRect,
  childARect: MatchRect,
  childBRect: MatchRect,
  side: BracketSide
): string {
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
    `M ${joinX} ${parentY} H ${parentEdgeX}`,
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
    `M ${joinX} ${parentY} H ${parentEdgeX}`,
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
  final,
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
      className={cn("flex items-center gap-2 transition-opacity", loser && "opacity-40")}
      style={{
        padding: "6px 8px",
        background: winner ? (final ? "#fefaf0" : "#fff") : "#fff",
      }}
    >
      <Flag countryCode={team.countryCode} label={team.name} className="shrink-0 text-base" />
      <span
        className="flex-1 min-w-0 truncate"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "12px",
          letterSpacing: "0.04em",
          color: winner ? "#0d0d10" : "rgba(13,13,16,0.7)",
        }}
      >
        {team.countryCode}
      </span>
      <span
        className="min-w-6 shrink-0 text-right"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "14px",
          letterSpacing: "-0.02em",
          color: winner ? (final ? "#D52B1E" : "#0d0d10") : "rgba(13,13,16,0.4)",
        }}
      >
        {played ? score : "-"}
      </span>
    </div>
  );
});
