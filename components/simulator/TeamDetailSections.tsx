import Link from "next/link";
import { Flag } from "@/components/Flag";
import { scoreDisplay } from "@/lib/tournament";
import type { Match, Team } from "@/lib/types/tournament";
import { cn } from "@/lib/utils";
import { ArrowLeft, Shield } from "lucide-react";
import { StatBox } from "@/components/ui/StatBox";

export function TeamHero({ team }: { team: Team }) {
  return (
    <header
      className="relative overflow-hidden"
      style={{
        background: "var(--color-wc-cream)",
        borderBottom: "3px solid var(--color-wc-ink)",
        padding: "28px 24px",
      }}
    >
      <Flag
        countryCode={team.countryCode}
        className="pointer-events-none absolute -right-12 top-1/2 hidden -translate-y-1/2 text-[16rem] opacity-[0.07] grayscale md:block"
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="relative min-w-0">
          <Link
            href="/teams"
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-60"
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.24em",
              color: "var(--color-wc-ink)",
              opacity: 0.55,
            }}
          >
            <ArrowLeft className="size-3" />
            DATABASE
          </Link>
          <div
            className="mt-3 flex flex-wrap items-center gap-2"
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.22em",
              color: "var(--color-wc-ink)",
            }}
          >
            <Flag countryCode={team.countryCode} label={team.name} className="text-xl" />
            <span
              className="px-2 py-1"
              style={{ background: "var(--color-wc-can-red)", color: "#fff" }}
            >
              GROUP {team.group}
            </span>
            <span style={{ opacity: 0.55 }}>{team.confederation}</span>
          </div>
          <h1
            className="mt-4 break-words"
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "clamp(40px, 7vw, 80px)",
              lineHeight: 0.85,
              letterSpacing: "-0.04em",
              color: "var(--color-wc-ink)",
            }}
          >
            {team.name.toUpperCase()}
          </h1>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 md:w-auto md:min-w-[32rem]">
          <StatBox value={team.fifaRanking} label="FIFA RANK" />
          <StatBox value={team.strength} label="POWER" />
          <StatBox value={team.attackStrength} label="ATTACK" />
          <StatBox value={team.defenseStrength} label="DEFENSE" />
        </div>
      </div>
    </header>
  );
}

export function TeamSquadSection({ team }: { team: Team }) {
  const groupedPlayers = groupPlayersByPosition(team.players);

  return (
    <section className="bg-white" style={{ border: "2px solid var(--color-wc-ink)" }}>
      <div
        className="flex items-center justify-between"
        style={{ background: "var(--color-wc-ink)", color: "#fff", padding: "12px 16px" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "16px",
            letterSpacing: "0.04em",
          }}
        >
          SQUAD MANIFEST
        </h2>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            opacity: 0.6,
          }}
        >
          {team.players.length} PLAYERS
        </span>
      </div>

      <div className="grid gap-px md:grid-cols-2" style={{ background: "var(--color-wc-ink)" }}>
        {groupedPlayers.map(([position, players]) => (
          <article key={position} className="bg-white p-4">
            <div
              className="mb-3 flex items-center justify-between"
              style={{
                borderBottom: "1px solid rgba(13,13,16,0.15)",
                paddingBottom: "8px",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "10px",
                  letterSpacing: "0.24em",
                  color: "var(--color-wc-ink)",
                  opacity: 0.65,
                }}
              >
                {positionLabel(position).toUpperCase()}
              </h3>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains-mono)",
                  fontSize: "10px",
                  color: "var(--color-wc-ink)",
                  opacity: 0.4,
                }}
              >
                {players.length.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="grid gap-2">
              {players.map((player) => (
                <div
                  key={player.name}
                  className="flex items-center justify-between gap-3 transition-transform hover:-translate-y-0.5"
                  style={{
                    border: "1px solid rgba(13,13,16,0.2)",
                    background: "var(--color-wc-cream)",
                    padding: "8px 12px",
                    transitionDuration: "120ms",
                  }}
                >
                  <span
                    className="min-w-0 truncate"
                    style={{
                      fontFamily: "var(--font-space-grotesk)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--color-wc-ink)",
                    }}
                  >
                    {player.name}
                  </span>
                  <span
                    className="shrink-0"
                    style={{
                      fontFamily: "var(--font-archivo-black)",
                      fontSize: "14px",
                      color: "var(--color-wc-can-red)",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {player.strength}
                  </span>
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
    <section className="bg-white" style={{ border: "2px solid var(--color-wc-ink)" }}>
      <div
        className="flex items-center justify-between"
        style={{ background: "var(--color-wc-ink)", color: "#fff", padding: "12px 16px" }}
      >
        <h2
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "16px",
            letterSpacing: "0.04em",
          }}
        >
          MATCH TELEMETRY
        </h2>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.22em",
            opacity: 0.6,
          }}
        >
          {matches.length} LOGS
        </span>
      </div>

      <div>
        {matches.map((match, index) => (
          <div
            key={match.id}
            className={cn(
              "grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4",
              !match.played && "opacity-50"
            )}
            style={{
              background: index % 2 === 0 ? "#fff" : "var(--color-wc-cream)",
              borderTop: index === 0 ? "none" : "1px solid rgba(13,13,16,0.1)",
            }}
          >
            <div className="flex min-w-0 items-center justify-end gap-2 text-right">
              <span
                className="min-w-0 truncate"
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-wc-ink)",
                }}
              >
                {match.homeTeam.name}
              </span>
              <Flag
                countryCode={match.homeTeam.countryCode}
                label={match.homeTeam.name}
                className="shrink-0 text-base"
              />
            </div>
            <div
              className="min-w-14 text-center"
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "16px",
                color: match.played ? "var(--color-wc-can-red)" : "rgba(13,13,16,0.35)",
                letterSpacing: "-0.02em",
              }}
            >
              {match.played ? scoreDisplay(match) : "VS"}
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <Flag
                countryCode={match.awayTeam.countryCode}
                label={match.awayTeam.name}
                className="shrink-0 text-base"
              />
              <span
                className="min-w-0 truncate"
                style={{
                  fontFamily: "var(--font-space-grotesk)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--color-wc-ink)",
                }}
              >
                {match.awayTeam.name}
              </span>
            </div>
          </div>
        ))}

        {!matches.length && (
          <div className="p-8 text-center">
            <Shield
              className="mx-auto mb-4 size-6"
              style={{ color: "rgba(13,13,16,0.35)" }}
            />
            <div
              className="mb-5"
              style={{
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: "10px",
                letterSpacing: "0.24em",
                color: "var(--color-wc-ink)",
                opacity: 0.55,
              }}
            >
              NO MATCH DATA RECORDED
            </div>
            <Link
              href="/groups"
              className="inline-flex transition-transform hover:-translate-y-0.5"
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "13px",
                letterSpacing: "0.04em",
                background: "#fff",
                color: "var(--color-wc-ink)",
                border: "2px solid var(--color-wc-ink)",
                padding: "10px 18px",
                transitionDuration: "120ms",
              }}
            >
              SIMULATE GROUPS
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export function TeamMetricGrid({ team }: { team: Team }) {
  return (
    <section
      className="grid grid-cols-3 gap-px"
      style={{ background: "var(--color-wc-ink)", border: "2px solid var(--color-wc-ink)" }}
    >
      <Metric label="ATT" value={team.attackStrength} accent="var(--color-wc-can-red)" />
      <Metric label="MID" value={team.midfieldStrength} accent="var(--color-wc-mex-green)" />
      <Metric label="DEF" value={team.defenseStrength} accent="#002868" />
    </section>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="text-center"
      style={{ background: "#fff", padding: "18px 12px" }}
    >
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "10px",
          letterSpacing: "0.24em",
          color: accent,
          marginBottom: "6px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "36px",
          letterSpacing: "-0.04em",
          color: "var(--color-wc-ink)",
          lineHeight: 0.9,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function groupPlayersByPosition(
  players: Team["players"]
): Array<[Team["players"][number]["position"], Team["players"]]> {
  const buckets: Record<Team["players"][number]["position"], Team["players"]> = {
    GOALKEEPER: [],
    DEFENDER: [],
    MIDFIELDER: [],
    FORWARD: [],
  };

  for (const player of players) {
    buckets[player.position].push(player);
  }

  return [
    ["GOALKEEPER", buckets.GOALKEEPER],
    ["DEFENDER", buckets.DEFENDER],
    ["MIDFIELDER", buckets.MIDFIELDER],
    ["FORWARD", buckets.FORWARD],
  ];
}

function positionLabel(position: Team["players"][number]["position"]): string {
  const labels = {
    GOALKEEPER: "Goalkeepers",
    DEFENDER: "Defenders",
    MIDFIELDER: "Midfielders",
    FORWARD: "Forwards",
  };
  return labels[position];
}
