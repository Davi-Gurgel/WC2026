import { memo } from "react";
import { Flag } from "@/components/Flag";
import { scoreDisplay } from "@/lib/tournament/matches";
import type { Match } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";

export const MatchRow = memo(function MatchRow({ match }: { match: Match }) {
  const roundLabel = match.knockoutRound
    ? formatKnockoutRound(match.knockoutRound)
    : `GROUP ${match.homeTeam.group}`;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center bg-white transition-transform hover:-translate-y-0.5",
        "px-4 py-3 sm:px-6 sm:py-4",
        !match.played && "opacity-60"
      )}
      style={{ border: "2px solid #0d0d10", transitionDuration: "120ms" }}
    >
      {/* Home */}
      <div className="flex min-w-0 items-center justify-end gap-2 text-right sm:gap-3">
        <span
          className="min-w-0 truncate"
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "13px",
            letterSpacing: "0.02em",
            color: "#0d0d10",
          }}
        >
          {match.homeTeam.name}
        </span>
        <Flag
          countryCode={match.homeTeam.countryCode}
          label={match.homeTeam.name}
          className="shrink-0 text-lg sm:text-xl"
        />
      </div>

      {/* Score */}
      <div className="mx-3 flex min-w-[88px] flex-col items-center justify-center gap-0.5 sm:mx-6 sm:min-w-[110px]">
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "9px",
            letterSpacing: "0.22em",
            color: "#0d0d10",
            opacity: 0.55,
          }}
        >
          {roundLabel}
        </div>
        <div
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "22px",
            letterSpacing: "-0.02em",
            color: match.played ? "#D52B1E" : "rgba(13,13,16,0.35)",
            lineHeight: 1,
          }}
        >
          {match.played ? scoreDisplay(match) : "VS"}
        </div>
        {match.wentToPenalties && (
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "9px",
              letterSpacing: "0.18em",
              color: "#D52B1E",
              opacity: 0.85,
            }}
          >
            PEN {match.homePenalties}-{match.awayPenalties}
          </div>
        )}
      </div>

      {/* Away */}
      <div className="flex min-w-0 items-center justify-start gap-2 sm:gap-3">
        <Flag
          countryCode={match.awayTeam.countryCode}
          label={match.awayTeam.name}
          className="shrink-0 text-lg sm:text-xl"
        />
        <span
          className="min-w-0 truncate"
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "13px",
            letterSpacing: "0.02em",
            color: "#0d0d10",
          }}
        >
          {match.awayTeam.name}
        </span>
      </div>
    </div>
  );
});

function formatKnockoutRound(round: NonNullable<Match["knockoutRound"]>): string {
  if (round.startsWith("ROUND_OF_")) return round.replace("ROUND_OF_", "R");
  return round.replaceAll("_", " ");
}
