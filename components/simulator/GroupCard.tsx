import { memo } from "react";
import { Flag } from "@/components/Flag";
import type { TeamGroupStats, WorldCupGroup } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";

const displayTeamName = (name: string) => (name === "Bosnia and Herzegovina" ? "Bosnia" : name);

export const GroupCard = memo(function GroupCard({ group }: { group: WorldCupGroup }) {
  return (
    <article
      className="content-auto flex flex-col bg-white"
      style={{ border: "2px solid #0d0d10" }}
    >
      <header
        className="flex items-center justify-between"
        style={{
          background: "#0d0d10",
          color: "#fff",
          padding: "10px 14px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "18px",
            letterSpacing: "0.02em",
          }}
        >
          GROUP {group.letter}
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            opacity: 0.6,
          }}
        >
          4 TEAMS
        </span>
      </header>
      <GroupTable group={group} />
      <MatchLog group={group} />
    </article>
  );
});

export function GroupLegend() {
  return (
    <section
      className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
      style={{
        fontFamily: "var(--font-jetbrains-mono)",
        fontSize: "10px",
        letterSpacing: "0.22em",
        color: "#0d0d10",
        opacity: 0.65,
      }}
    >
      <Legend color="#006847" label="ADVANCING (TOP 2)" />
      <Legend color="#0d0d10" label="3RD PLACE" />
      <Legend color="#e5e5e5" label="ELIMINATED" />
    </section>
  );
}

function GroupTable({ group }: { group: WorldCupGroup }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr
            style={{
              background: "#fefaf0",
              borderBottom: "2px solid #0d0d10",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.18em",
              color: "#0d0d10",
            }}
          >
            <th className="w-7 px-2 py-2 font-normal opacity-50">#</th>
            <th className="px-2 py-2 font-normal">TEAM</th>
            <th className="w-7 px-1 py-2 text-right font-normal opacity-60">P</th>
            <th className="w-7 px-1 py-2 text-right font-normal opacity-60">W</th>
            <th className="w-7 px-1 py-2 text-right font-normal opacity-60">D</th>
            <th className="w-7 px-1 py-2 text-right font-normal opacity-60">L</th>
            <th className="w-9 px-1 py-2 text-right font-normal opacity-50">GD</th>
            <th className="w-10 px-2 py-2 text-right" style={{ color: "#D52B1E" }}>PTS</th>
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

  const advancing = index < 2;
  const thirdPlace = index === 2;

  return (
    <tr
      className={cn("transition-colors", thirdPlace ? "bg-wc-paper" : index === 3 ? "opacity-40" : "")}
      style={{ borderBottom: "1px solid rgba(13,13,16,0.1)" }}
    >
      <td className="px-2 py-2 align-middle">
        <div className="flex items-center gap-1.5">
          {advancing && (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "#006847" }}
            />
          )}
          {!advancing && thirdPlace && (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "#0d0d10" }}
            />
          )}
          {!advancing && !thirdPlace && (
            <span
              aria-hidden="true"
              className="inline-block h-2 w-2 shrink-0"
              style={{ background: "#e5e5e5" }}
            />
          )}
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "11px",
              color: "#0d0d10",
              opacity: 0.55,
            }}
          >
            {index + 1}
          </span>
        </div>
      </td>
      <td className="min-w-0 px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Flag countryCode={countryCode} label={team.teamName} className="h-3 w-4 shrink-0" />
          <span
            className="truncate"
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "12px",
              letterSpacing: "0.04em",
              color: "#0d0d10",
            }}
          >
            {countryCode}
          </span>
        </div>
      </td>
      <td className="px-1 py-2 text-right" style={cellStyle()}>
        {team.played}
      </td>
      <td className="px-1 py-2 text-right" style={cellStyle()}>
        {team.wins}
      </td>
      <td className="px-1 py-2 text-right" style={cellStyle()}>
        {team.draws}
      </td>
      <td className="px-1 py-2 text-right" style={cellStyle()}>
        {team.losses}
      </td>
      <td className="px-1 py-2 text-right" style={{ ...cellStyle(), opacity: 0.5 }}>
        {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
      </td>
      <td
        className="px-2 py-2 text-right"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "14px",
          color: "#D52B1E",
        }}
      >
        {team.points}
      </td>
    </tr>
  );
}

function cellStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-jetbrains-mono)",
    fontSize: "11px",
    color: "#0d0d10",
    opacity: 0.75,
  };
}

function MatchLog({ group }: { group: WorldCupGroup }) {
  return (
    <div
      className="mt-auto"
      style={{
        background: "#fefaf0",
        borderTop: "2px solid #0d0d10",
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "9px",
          letterSpacing: "0.22em",
          color: "#0d0d10",
          opacity: 0.55,
          marginBottom: "6px",
        }}
      >
        MATCH LOG
      </div>
      <div className="flex flex-col gap-1">
        {group.matches.map((match) => (
          <div
            key={match.id}
            className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2"
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              color: "#0d0d10",
              opacity: match.played ? 0.85 : 0.4,
            }}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              <Flag countryCode={match.homeTeam.countryCode} label={match.homeTeam.name} className="h-2.5 w-3.5 shrink-0" />
              <span className="truncate">{displayTeamName(match.homeTeam.name)}</span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "11px",
                color: match.played ? "#0d0d10" : "rgba(13,13,16,0.4)",
                letterSpacing: "0.04em",
              }}
            >
              {match.played ? `${match.homeScore}-${match.awayScore}` : "VS"}
            </span>
            <span className="flex min-w-0 items-center justify-end gap-1.5 text-right">
              <span className="truncate">{displayTeamName(match.awayTeam.name)}</span>
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
      <span aria-hidden="true" className="inline-block h-2.5 w-2.5" style={{ background: color }} />
      {label}
    </span>
  );
}
