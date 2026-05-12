import { memo } from "react";
import { Flag } from "@/components/Flag";
import type { TeamGroupStats, WorldCupGroup } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";

const displayTeamName = (name: string) => (name === "Bosnia and Herzegovina" ? "Bosnia" : name);

export const GroupCard = memo(function GroupCard({ group }: { group: WorldCupGroup }) {
  return (
    <article className="content-auto flex flex-col border border-glass-border bg-navy-panel/40">
      <div className="flex items-center justify-between border-b border-glass-border bg-white/5 px-4 py-3">
        <span className="font-outfit text-xl font-black uppercase tracking-tight text-white">Group {group.letter}</span>
        <span className="font-mono text-[10px] tracking-widest text-white/30">4 TEAMS</span>
      </div>
      <GroupTable group={group} />
      <MatchLog group={group} />
    </article>
  );
});

export function GroupLegend() {
  return (
    <section className="mt-8 flex flex-wrap gap-6 label-micro tracking-widest text-white/40">
      <Legend color="bg-success-bright" label="Advancing (Top 2)" />
      <Legend color="bg-white/40" label="3rd Place (Wildcard Pool)" />
      <Legend color="bg-black border border-glass-border" label="Eliminated" />
    </section>
  );
}

function GroupTable({ group }: { group: WorldCupGroup }) {
  return (
    <div>
      <table className="w-full table-fixed text-left font-mono text-[9px] uppercase sm:text-[10px]">
        <thead className="border-b border-glass-border text-white/40">
          <tr>
            <th className="w-7 px-2 py-2 font-normal">#</th>
            <th className="px-2 py-2 font-normal">Team</th>
            <th className="w-7 px-1 py-2 font-normal text-right">P</th>
            <th className="w-7 px-1 py-2 font-normal text-right">W</th>
            <th className="w-7 px-1 py-2 font-normal text-right">D</th>
            <th className="w-7 px-1 py-2 font-normal text-right">L</th>
            <th className="w-9 px-1 py-2 font-normal text-right text-white/20">GD</th>
            <th className="w-10 px-2 py-2 text-right font-bold text-white">PTS</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((team, index) => (
            <GroupTableRow key={team.teamName} group={group} team={team} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupTableRow({ group, team, index }: { group: WorldCupGroup; team: TeamGroupStats; index: number }) {
  const countryCode =
    team.countryCode ??
    group.teams.find((candidate) => candidate.name === team.teamName)?.countryCode ??
    team.teamName.slice(0, 3).toUpperCase();

  return (
    <tr
      className={cn(
        "border-b border-glass-border/50",
        index < 2 ? "bg-wc-green/5" : index === 2 ? "bg-white/5" : "opacity-40 grayscale"
      )}
    >
      <td className="px-2 py-2 text-white/40">{index + 1}</td>
      <td className="min-w-0 px-2 py-2 font-bold text-white">
        <div className="flex min-w-0 items-center gap-2">
          <Flag countryCode={countryCode} label={team.teamName} className="h-3 w-4 shrink-0" />
          <span className="truncate">{countryCode}</span>
        </div>
      </td>
      <td className="px-1 py-2 text-right">{team.played}</td>
      <td className="px-1 py-2 text-right">{team.wins}</td>
      <td className="px-1 py-2 text-right">{team.draws}</td>
      <td className="px-1 py-2 text-right">{team.losses}</td>
      <td className="px-1 py-2 text-right text-white/20">
        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
      </td>
      <td className="px-2 py-2 text-right font-black text-white">{team.points}</td>
    </tr>
  );
}

function MatchLog({ group }: { group: WorldCupGroup }) {
  return (
    <div className="mt-auto border-t border-glass-border bg-black/20 p-3">
      <div className="mb-2 text-[8px] font-bold uppercase tracking-widest text-white/30">Match Log</div>
      <div className="flex flex-col gap-1">
        {group.matches.map((match) => (
          <div
            key={match.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 font-mono text-[9px]",
              match.played ? "text-white/60" : "text-white/20"
            )}
          >
            <span className="flex min-w-0 items-center gap-1">
              <Flag countryCode={match.homeTeam.countryCode} label={match.homeTeam.name} className="h-2.5 w-3.5 shrink-0" />
              <span className="break-words leading-tight">{displayTeamName(match.homeTeam.name)}</span>
            </span>
            <span className={cn("font-bold", match.played ? "text-white" : "")}>
              {match.played ? `${match.homeScore}-${match.awayScore}` : "vs"}
            </span>
            <span className="flex min-w-0 items-center justify-end gap-1 text-right">
              <span className="break-words leading-tight">{displayTeamName(match.awayTeam.name)}</span>
              <Flag countryCode={match.awayTeam.countryCode} label={match.awayTeam.name} className="h-2.5 w-3.5 shrink-0" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("size-2 rounded-sm", color)} />
      {label}
    </span>
  );
}