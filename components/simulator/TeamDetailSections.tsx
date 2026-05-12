import Link from "next/link";
import type { ReactNode } from "react";
import { Flag } from "@/components/Flag";
import { scoreDisplay } from "@/lib/tournament/matches";
import type { Match, Team } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";
import { Activity, ArrowLeft, Shield, Swords, UsersRound } from "lucide-react";

export function TeamHero({ team }: { team: Team }) {
  return (
    <header className="relative overflow-hidden border-b border-glass-border bg-navy-panel/30 px-6 pb-4 pt-0 backdrop-blur-md">
      <Flag countryCode={team.countryCode} className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 text-[18rem] opacity-[0.035] grayscale" />
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="relative">
          <Link href="/teams" className="inline-flex items-center gap-2 label-micro text-white/40 transition-colors hover:text-white">
            <ArrowLeft className="size-3" />
            Database
          </Link>
          <div className="mb-3 mt-1 flex items-center gap-3 label-micro text-wc-blue">
            <Flag countryCode={team.countryCode} label={team.name} className="text-2xl" />
            <span>{team.confederation} / Group {team.group}</span>
          </div>
          <h1 className="font-outfit text-5xl font-black uppercase tracking-tighter text-white md:text-7xl">{team.name}</h1>
        </div>

        <div className="grid grid-cols-2 gap-px border border-glass-border bg-glass-border sm:grid-cols-4 md:min-w-[32.5rem]">
          <DetailStat value={team.fifaRanking} label="FIFA Rank" />
          <DetailStat value={team.strength} label="Power" />
          <DetailStat value={team.attackStrength} label="Attack" />
          <DetailStat value={team.defenseStrength} label="Defense" />
        </div>
      </div>
    </header>
  );
}

export function TeamSquadSection({ team }: { team: Team }) {
  const groupedPlayers = groupPlayersByPosition(team.players);

  return (
    <section className="border border-glass-border bg-navy-panel/40">
      <div className="flex items-center justify-between border-b border-glass-border bg-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <UsersRound className="size-4 text-wc-blue" />
          <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-white">Squad manifest</h2>
        </div>
        <span className="label-micro tracking-widest text-white/30">{team.players.length} players</span>
      </div>

      <div className="grid gap-px bg-glass-border md:grid-cols-2">
        {groupedPlayers.map(([position, players]) => (
          <article key={position} className="bg-navy-panel/80 p-5">
            <div className="mb-4 flex items-center justify-between border-b border-glass-border/60 pb-3">
              <h3 className="label-micro text-white/50">{positionLabel(position)}</h3>
              <span className="font-mono text-[10px] text-white/25">{players.length.toString().padStart(2, "0")}</span>
            </div>
            <div className="grid gap-2">
              {players.map((player) => (
                <div key={player.name} className="group flex items-center justify-between border border-glass-border/50 bg-black/10 px-3 py-3 transition-colors hover:border-white/20 hover:bg-white/5">
                  <span className="truncate font-outfit text-sm font-semibold text-white/80 group-hover:text-white">{player.name}</span>
                  <span className="ml-3 font-mono text-sm font-black text-white">{player.strength}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TeamTelemetry({ matches }: { matches: Match[] }) {
  return (
    <section className="border border-glass-border bg-navy-panel/40">
      <div className="flex items-center justify-between border-b border-glass-border bg-white/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <Activity className="size-4 text-wc-red" />
          <h2 className="font-outfit text-xl font-black uppercase tracking-tight text-white">Match telemetry</h2>
        </div>
        <span className="label-micro tracking-widest text-white/30">{matches.length} logs</span>
      </div>

      <div className="divide-y divide-glass-border/60">
        {matches.map((match) => (
          <div
            key={match.id}
            className={cn(
              "grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 font-mono text-[10px] uppercase",
              !match.played && "opacity-45 grayscale"
            )}
          >
            <div className="flex min-w-0 items-center justify-end gap-2 text-right text-white/60">
              <span className="truncate">{match.homeTeam.name}</span>
              <Flag countryCode={match.homeTeam.countryCode} label={match.homeTeam.name} />
            </div>
            <div className={cn("min-w-16 text-center text-sm font-black", match.played ? "text-wc-red" : "text-white/25")}>
              {match.played ? scoreDisplay(match) : "VS"}
            </div>
            <div className="flex min-w-0 items-center gap-2 text-white/60">
              <Flag countryCode={match.awayTeam.countryCode} label={match.awayTeam.name} />
              <span className="truncate">{match.awayTeam.name}</span>
            </div>
          </div>
        ))}

        {!matches.length && (
          <div className="p-8 text-center">
            <Shield className="mx-auto mb-4 size-6 text-white/20" />
            <div className="mb-4 label-micro tracking-widest text-white/30">No match data recorded</div>
            <Link href="/groups" className="inline-flex border border-wc-blue/50 px-4 py-2 label-micro tracking-widest text-wc-blue transition-colors hover:bg-wc-blue hover:text-white">
              Simulate groups
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function TeamMetricGrid({ team }: { team: Team }) {
  return (
    <section className="grid grid-cols-3 gap-px border border-glass-border bg-glass-border">
      <Metric icon={<Swords className="size-4" />} label="ATT" value={team.attackStrength} />
      <Metric icon={<Activity className="size-4" />} label="MID" value={team.midfieldStrength} />
      <Metric icon={<Shield className="size-4" />} label="DEF" value={team.defenseStrength} />
    </section>
  );
}

function DetailStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-navy p-5 text-left">
      <div className="font-mono text-3xl font-black tabular-nums text-white">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{label}</div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="bg-navy-panel/80 p-5 text-center">
      <div className="mx-auto mb-3 flex size-9 items-center justify-center border border-glass-border text-white/50">{icon}</div>
      <div className="label-micro text-white/35">{label}</div>
      <div className="mt-1 font-outfit text-3xl font-black text-white">{value}</div>
    </div>
  );
}

function groupPlayersByPosition(players: Team["players"]): Array<[Team["players"][number]["position"], Team["players"]]> {
  const buckets: Record<Team["players"][number]["position"], Team["players"]> = {
    GOALKEEPER: [],
    DEFENDER: [],
    MIDFIELDER: [],
    FORWARD: []
  };

  for (const player of players) {
    buckets[player.position].push(player);
  }

  return [
    ["GOALKEEPER", buckets.GOALKEEPER],
    ["DEFENDER", buckets.DEFENDER],
    ["MIDFIELDER", buckets.MIDFIELDER],
    ["FORWARD", buckets.FORWARD]
  ];
}

function positionLabel(position: Team["players"][number]["position"]): string {
  const labels = {
    GOALKEEPER: "Goalkeepers",
    DEFENDER: "Defenders",
    MIDFIELDER: "Midfielders",
    FORWARD: "Forwards"
  };
  return labels[position];
}
