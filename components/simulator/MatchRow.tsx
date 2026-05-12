import { memo } from "react";
import { Flag } from "@/components/Flag";
import { scoreDisplay } from "@/lib/tournament/matches";
import type { Match } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";

export const MatchRow = memo(function MatchRow({ match }: { match: Match }) {
  const roundLabel = match.knockoutRound ? formatKnockoutRound(match.knockoutRound) : `GROUP ${match.homeTeam.group}`;

  return (
    <div
      className={cn(
        "grid grid-cols-[1fr_auto_1fr] items-center border border-glass-border bg-navy-panel/40 px-6 py-4 transition-colors hover:border-white/20",
        !match.played && "opacity-50 grayscale"
      )}
    >
      <div className="flex items-center justify-end gap-4 text-right">
        <span className="font-outfit text-sm font-bold text-white sm:text-base">{match.homeTeam.name}</span>
        <Flag countryCode={match.homeTeam.countryCode} label={match.homeTeam.name} className="text-xl sm:text-2xl" />
      </div>

      <div className="mx-6 flex min-w-[100px] flex-col items-center justify-center gap-1">
        <div className="font-mono text-xs uppercase tracking-widest text-white/30">{roundLabel}</div>
        <div className={cn("w-full text-center font-mono text-xl font-black sm:text-2xl", match.played ? "text-wc-red" : "text-white/20")}>
          {match.played ? scoreDisplay(match) : "VS"}
        </div>
        {match.wentToPenalties && (
          <div className="label-tiny tracking-widest text-wc-red/70">
            PEN: {match.homePenalties}-{match.awayPenalties}
          </div>
        )}
      </div>

      <div className="flex items-center justify-start gap-4">
        <Flag countryCode={match.awayTeam.countryCode} label={match.awayTeam.name} className="text-xl sm:text-2xl" />
        <span className="font-outfit text-sm font-bold text-white sm:text-base">{match.awayTeam.name}</span>
      </div>
    </div>
  );
});

function formatKnockoutRound(round: NonNullable<Match["knockoutRound"]>): string {
  if (round.startsWith("ROUND_OF_")) return round.replace("ROUND_OF_", "R");
  return round.replaceAll("_", " ");
}
