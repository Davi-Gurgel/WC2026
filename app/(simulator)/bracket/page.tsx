"use client";

import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Flag } from "@/components/Flag";
import { useTournament } from "@/components/TournamentProvider";
import { BracketSide, MatchRect, getConnectorPath, getFinalConnectorPath } from "@/components/simulator/bracket-geometry";
import { useChampionCelebration } from "@/components/simulator/useChampionCelebration";
import { phaseLabel, getWinner, isTournamentCompleted, roundMatches, bracketFinal } from "@/lib/tournament";
import type { Match } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

type ConnectorPath = {
  id: string;
  path: string;
  side: BracketSide;
};

const SIDE_STROKE = {
  left: "#002868",
  right: "var(--color-wc-mex-green)",
} satisfies Record<BracketSide, string>;

export default function BracketPage() {
  const { state, simulateKnockoutRound } = useTournament();
  const bracketContainerRef = useRef<HTMLDivElement>(null);
  const championRef = useRef<HTMLElement>(null);
  const matchRefs = useRef<Map<string, HTMLElement>>(new Map());
  const championId = state.champion?.countryCode ?? null;
  const [connectorPaths, setConnectorPaths] = useState<ConnectorPath[]>([]);
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });
  useChampionCelebration(championId, championRef);
  const bracketSides = useMemo(() => {
    const r32 = roundMatches(state.bracket, "ROUND_OF_32");
    const r16 = roundMatches(state.bracket, "ROUND_OF_16");
    const qf = roundMatches(state.bracket, "QUARTERFINAL");
    const sf = roundMatches(state.bracket, "SEMIFINAL");
    return {
      left: [
        ["Round of 32", splitMatches(r32).left],
        ["Round of 16", splitMatches(r16).left],
        ["Quarter-finals", splitMatches(qf).left],
        ["Semi-finals", splitMatches(sf).left],
      ] satisfies BracketRound[],
      right: [
        ["Semi-finals", splitMatches(sf).right],
        ["Quarter-finals", splitMatches(qf).right],
        ["Round of 16", splitMatches(r16).right],
        ["Round of 32", splitMatches(r32).right],
      ] satisfies BracketRound[],
    };
  }, [state.bracket]);
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
      const connectorAnchor = node.querySelector<HTMLElement>("[data-connector-anchor]");
      const anchorRect = connectorAnchor?.getBoundingClientRect();
      const connectorY = anchorRect
        ? anchorRect.top - containerRect.top + anchorRect.height / 2
        : rect.top - containerRect.top + rect.height / 2;

      rectByMatchId.set(matchId, {
        left: rect.left - containerRect.left,
        right: rect.right - containerRect.left,
        connectorY,
      });
    }

    const nextPaths: ConnectorPath[] = [];
    const ROUND_KEYS = ["round-of-32", "round-of-16", "quarter-finals", "semi-finals"];

    const addRoundConnectorPaths = (side: BracketSide) => {
      for (let level = 0; level < ROUND_KEYS.length - 1; level += 1) {
        const childRoundKey = ROUND_KEYS[level];
        const parentRoundKey = ROUND_KEYS[level + 1];
        const parentCount = 2 ** (2 - level);

        for (let parentIndex = 0; parentIndex < parentCount; parentIndex += 1) {
          const parentSlotId = `${side}-${parentRoundKey}-${parentIndex}`;
          const childASlotId = `${side}-${childRoundKey}-${parentIndex * 2}`;
          const childBSlotId = `${side}-${childRoundKey}-${parentIndex * 2 + 1}`;

          const parentRect = rectByMatchId.get(parentSlotId);
          const childARect = rectByMatchId.get(childASlotId);
          const childBRect = rectByMatchId.get(childBSlotId);

          if (!parentRect || !childARect || !childBRect) continue;

          nextPaths.push({
            id: `${side}-${parentSlotId}-${childASlotId}-${childBSlotId}`,
            side,
            path: getConnectorPath(parentRect, childARect, childBRect, side),
          });
        }
      }
    };

    addRoundConnectorPaths("left");
    addRoundConnectorPaths("right");

    const finalRect = rectByMatchId.get("final");
    const leftSemiFinalRect = rectByMatchId.get("left-semi-finals-0");
    const rightSemiFinalRect = rectByMatchId.get("right-semi-finals-0");

    if (finalRect && leftSemiFinalRect) {
      nextPaths.push({
        id: `left-final-left-semi-finals-0`,
        side: "left",
        path: getFinalConnectorPath(finalRect, leftSemiFinalRect, "left"),
      });
    }

    if (finalRect && rightSemiFinalRect) {
      nextPaths.push({
        id: `right-final-right-semi-finals-0`,
        side: "right",
        path: getFinalConnectorPath(finalRect, rightSemiFinalRect, "right"),
      });
    }

    setSvgSize((previous) =>
      previous.width === nextSize.width && previous.height === nextSize.height ? previous : nextSize
    );
    setConnectorPaths(nextPaths);
  }, [groupStageComplete]);

  useLayoutEffect(() => {
    const container = bracketContainerRef.current;
    if (!container || !groupStageComplete) return;

    // Reference state here so it is tracked as a dependency and triggers layout recalculation when matches update
    const _state = state;

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
  }, [groupStageComplete, updateConnectorGeometry, state]);

  return (
    <main className="flex-1 pb-24" style={{ background: "var(--color-wc-cream)" }}>
      <PageHeader eyebrow="PHASE · 02" title="KNOCKOUT STAGE" badge={phaseLabel(state.phase).toUpperCase()} />

      <div className="mx-auto max-w-[104rem] px-4 py-8 sm:px-6">
        {!groupStageComplete ? (
          <div
            className="mx-auto w-full max-w-md text-center"
            style={{
              background: "#fff",
              border: "3px solid var(--color-wc-ink)",
              boxShadow: "8px 8px 0 0 var(--color-wc-can-red)",
              padding: "32px 28px",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10px",
                letterSpacing: "0.24em",
                color: "var(--color-wc-can-red)",
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
                color: "var(--color-wc-ink)",
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
                color: "var(--color-wc-ink)",
                opacity: 0.6,
                marginBottom: "22px",
              }}
            >
              Bracket generation unlocks when Phase 01 concludes.
            </p>
            <LinkButton
              href="/groups"
              variant="primary"
              style={{ boxShadow: "4px 4px 0 0 var(--color-wc-can-red)" }}
            >
              RETURN TO GROUPS
            </LinkButton>
          </div>
        ) : (
          <>
            {state.champion && (
              <section
                key={state.champion.countryCode}
                ref={championRef}
                className="champion-card mx-auto mb-12 flex max-w-2xl flex-col items-center text-center"
                style={{
                  background: "#fff",
                  border: "3px solid var(--color-wc-ink)",
                  boxShadow: "8px 8px 0 0 var(--color-wc-can-red)",
                  padding: "32px 28px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    color: "var(--color-wc-can-red)",
                    marginBottom: "10px",
                  }}
                >
                  WORLD CHAMPION 2026
                </div>
                <h2
                  className="champion-name break-words"
                  style={{
                    fontFamily: "var(--font-archivo-black)",
                    fontSize: "clamp(36px, 6vw, 64px)",
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    color: "var(--color-wc-ink)",
                  }}
                >
                  {state.champion.name.toUpperCase()}
                </h2>
                <Flag
                  countryCode={state.champion.countryCode}
                  label={state.champion.name}
                  className="champion-flag mt-6 text-6xl"
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
                    <g key={connector.id}>
                      <path
                        d={connector.path}
                        fill="none"
                        stroke="var(--color-wc-cream)"
                        strokeWidth={5}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                      <path
                        d={connector.path}
                        fill="none"
                        stroke={SIDE_STROKE[connector.side]}
                        strokeOpacity={0.62}
                        strokeWidth={1.5}
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                      />
                    </g>
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
                          color: "var(--color-wc-can-red)",
                          borderBottom: "2px solid var(--color-wc-can-red)",
                          paddingBottom: "6px",
                        }}
                      >
                        FINAL
                      </div>
                      {bracketFinal(state.bracket) ? (
                        <BracketMatch match={bracketFinal(state.bracket)!} final slotId="final" onMatchRef={registerMatchRef} />
                      ) : (
                        <EmptyMatchSlot slotId="final" onMatchRef={registerMatchRef} />
                      )}
                    </div>
                    <div className="row-start-3 mt-8">
                      <div
                        className="mb-3 text-center"
                        style={{
                          fontFamily: "var(--font-jetbrains-mono)",
                          fontSize: "10px",
                          letterSpacing: "0.24em",
                          color: "var(--color-wc-ink)",
                          opacity: 0.45,
                        }}
                      >
                        THIRD PLACE
                      </div>
                      {state.bracket.thirdPlace ? (
                        <BracketMatch match={state.bracket.thirdPlace} compact slotId="third-place" onMatchRef={registerMatchRef} />
                      ) : (
                        <EmptyMatchSlot slotId="third-place" onMatchRef={registerMatchRef} />
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
                <Button
                  type="button"
                  variant="primary"
                  onClick={simulateKnockoutRound}
                  disabled={isTournamentCompleted(state)}
                  className="disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ padding: "14px 26px" }}
                >
                  <span
                    aria-hidden="true"
                    className="inline-block animate-pulse"
                    style={{ width: 8, height: 8, background: "var(--color-wc-can-red)" }}
                  />
                  SIMULATE {nextRoundLabel.toUpperCase()}
                </Button>
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
        const roundKey = title.toLowerCase().replace(/\s+/g, "-");
        const slotId = `${side}-${roundKey}-${index}`;

        return (
          <div
            className="z-10 flex items-center"
            key={match?.id ?? slotId}
            style={{ gridRow: `${index * rowSpan + 1} / span ${rowSpan}` }}
          >
            {match ? (
              <BracketMatch match={match} slotId={slotId} onMatchRef={onMatchRef} />
            ) : (
              <EmptyMatchSlot slotId={slotId} onMatchRef={onMatchRef} />
            )}
          </div>
        );
      })}
    </div>
  );
});

const EmptyMatchSlot = memo(function EmptyMatchSlot({
  slotId,
  onMatchRef,
}: {
  slotId?: string;
  onMatchRef?: (matchId: string, node: HTMLElement | null) => void;
}) {
  return (
    <article
      aria-hidden="true"
      ref={(node) => {
        if (slotId && onMatchRef) {
          onMatchRef(slotId, node);
        }
      }}
      className="relative z-10 my-2 w-full"
      style={{
        background: "var(--color-wc-cream)",
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
      <div data-connector-anchor style={{ height: 1, background: "rgba(13,13,16,0.1)" }} />
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
  slotId,
  onMatchRef,
}: {
  match: Match;
  final?: boolean;
  compact?: boolean;
  slotId?: string;
  onMatchRef?: (matchId: string, node: HTMLElement | null) => void;
}) {
  const winner = getWinner(match);

  return (
    <article
      data-match-id={match.id}
      ref={(node) => {
        if (slotId && onMatchRef) {
          onMatchRef(slotId, node);
        } else if (onMatchRef) {
          onMatchRef(match.id, node);
        }
      }}
      className={cn(
        "relative z-10 my-2 w-full transition-transform hover:-translate-y-0.5",
        compact && "opacity-90"
      )}
      style={{
        background: "#fff",
        border: final ? "2px solid var(--color-wc-can-red)" : "2px solid var(--color-wc-ink)",
        boxShadow: final ? "4px 4px 0 0 var(--color-wc-can-red)" : "none",
        transitionDuration: "120ms",
      }}
    >
      <div
        className="flex justify-between gap-2"
        style={{
          background: final ? "var(--color-wc-can-red)" : "var(--color-wc-ink)",
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
      <div data-connector-anchor style={{ height: 1, background: "rgba(13,13,16,0.12)" }} />
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
        background: winner ? (final ? "var(--color-wc-cream)" : "#fff") : "#fff",
      }}
    >
      <Flag countryCode={team.countryCode} label={team.name} className="shrink-0 text-base" />
      <span
        className="flex-1 min-w-0 truncate"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "12px",
          letterSpacing: "0.04em",
          color: winner ? "var(--color-wc-ink)" : "rgba(13,13,16,0.7)",
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
          color: winner ? (final ? "var(--color-wc-can-red)" : "var(--color-wc-ink)") : "rgba(13,13,16,0.4)",
        }}
      >
        {played ? score : "-"}
      </span>
    </div>
  );
});
