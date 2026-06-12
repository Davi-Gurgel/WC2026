"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useTournament } from "@/components/TournamentProvider";
import { FLAG_COLORS } from "@/lib/flagColors";
import { X } from "lucide-react";

const tickerTeams = [
  "MEX", "KOR", "RSA", "CZE", "CAN", "SUI", "QAT", "BIH",
  "BRA", "MAR", "HAI", "SCO", "USA", "PAR", "AUS", "TUR",
  "GER", "CUW", "CIV", "ECU", "NED", "JPN", "SWE", "TUN",
  "BEL", "EGY", "IRN", "NZL", "ESP", "CPV", "KSA", "URU",
  "FRA", "SEN", "NOR", "IRQ", "ARG", "ALG", "AUT", "JOR",
  "POR", "COL", "UZB", "COD", "ENG", "CRO", "GHA", "PAN",
];

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ n, label }: { n: string; label: string }) {
  return (
    <div
      className="festival-stats-card bg-white text-center transition-transform ease-out hover:-translate-y-0.5"
      style={{ border: "2px solid var(--color-wc-ink)", padding: "16px 14px", transitionDuration: "120ms" }}
    >
      <div
        className="festival-stats-card-num"
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "clamp(58px, 5vw, 78px)",
          lineHeight: 0.9,
          color: "var(--color-wc-ink)",
          letterSpacing: "-0.04em",
        }}
      >
        {n}
      </div>
      <div
        className="festival-stats-card-label"
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "11px",
          letterSpacing: "0.22em",
          color: "var(--color-wc-ink)",
          opacity: 0.55,
          marginTop: "8px",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function Ticker({ teams }: { teams: string[] }) {
  const doubled = [...teams, ...teams];
  return (
    <div
      className="festival-ticker relative flex items-center overflow-hidden"
      style={{ background: "var(--color-wc-ink)", gridColumn: "1 / 4", gridRow: "3" }}
    >
      {/* Left badge */}
      <div
        className="festival-ticker-badge flex flex-shrink-0 items-center self-stretch z-10"
        style={{
          background: "var(--color-wc-can-red)",
          color: "#fff",
          padding: "0 16px",
          fontFamily: "var(--font-archivo-black)",
          fontSize: "13px",
          letterSpacing: "0.08em",
        }}
      >
        48 QUALIFIED →
      </div>

      {/* Scrolling teams */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%)",
        }}
      >
        <div
          className="wc-ticker-inner festival-ticker-inner flex items-center"
          style={{
            gap: "28px",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-archivo-black)",
            fontSize: "20px",
            letterSpacing: "0.04em",
            paddingLeft: "28px",
          }}
        >
          {doubled.map((code, i) => (
            <span key={i} style={{ color: FLAG_COLORS[code] ?? "#fff" }}>
              {code}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const facts = [
  "Final match set for July 19, 2026 at MetLife Stadium, NJ.",
  "Historic expansion: 48 nations competing across 104 matches.",
  "Tri-host alignment: USA, Mexico, and Canada over 16 cities.",
  "Debutants: Curaçao, Cape Verde, Jordan, and Uzbekistan.",
  "Mexico becomes the first nation to host the tournament three times.",
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { state, hydrated, startTournament, resetTournament } = useTournament();
  const router = useRouter();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setFactIndex((i) => (i + 1) % facts.length),
      6000
    );
    return () => window.clearInterval(timer);
  }, []);

  const confirmRestart = () => {
    resetTournament();
    setShowRestartConfirm(false);
  };

  return (
    <main className="festival-grid">
      {/* ── 1. Mexico block ─────────────────────────────────────────────── */}
      <div
        className="festival-host relative overflow-hidden text-white"
        style={{ background: "var(--color-wc-mex-green)", padding: "22px", gridColumn: "1", gridRow: "1" }}
      >
        <div
          className="festival-host-meta"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            opacity: 0.85,
          }}
        >
          HOST · 01
        </div>
        <div
          className="festival-host-name"
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "clamp(40px, 5vw, 64px)",
            lineHeight: 0.85,
            marginTop: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          MÉXICO
        </div>
        <div
          className="festival-host-meta"
          style={{
            marginTop: "10px",
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
          }}
        >
          3 CITIES · 13 MATCHES
        </div>
        {/* Mexico flag */}
        <span
          className="festival-host-flag fi fi-mx absolute"
          aria-hidden="true"
          style={{
            width: "260px",
            height: "173px",
            right: "-90px",
            top: "50%",
            transform: "translateY(-50%) rotate(8deg)",
            opacity: 0.7,
            backgroundSize: "cover",
            border: "4px solid #fff",
          }}
        />
      </div>

      {/* ── 2. Center title block (spans rows 1–2) ──────────────────────── */}
      <div
        className="festival-title relative overflow-hidden flex flex-col justify-between gap-5"
        style={{
          background: "var(--color-wc-cream)",
          border: "3px solid var(--color-wc-ink)",
          padding: "32px 36px",
          gridColumn: "2",
          gridRow: "1 / 3",
        }}
      >
        {/* Top tag row */}
        <div className="flex items-center gap-2.5">
          <div
            style={{
              background: "var(--color-wc-can-red)",
              color: "#fff",
              padding: "5px 10px",
              fontFamily: "var(--font-archivo-black)",
              fontSize: "12px",
              letterSpacing: "0.06em",
            }}
          >
            KICKS OFF JUN 11
          </div>
          <div
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "10px",
              letterSpacing: "0.24em",
              opacity: 0.6,
              color: "var(--color-wc-ink)",
            }}
          >
            FINAL · JUL 19 · METLIFE
          </div>
        </div>

        {/* Title stack */}
        <div>
          <div
            className="festival-title-word"
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "clamp(64px, 9vw, 116px)",
              lineHeight: 0.82,
              letterSpacing: "-0.04em",
              color: "var(--color-wc-ink)",
            }}
          >
            WORLD
          </div>
          <div
            className="festival-title-word"
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "clamp(64px, 9vw, 116px)",
              lineHeight: 0.82,
              letterSpacing: "-0.04em",
              color: "#002868",
              marginTop: "-2px",
            }}
          >
            CUP
          </div>
          <div
            className="festival-title-year"
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "clamp(88px, 13vw, 170px)",
              lineHeight: 0.8,
              letterSpacing: "-0.05em",
              color: "var(--color-wc-can-red)",
              marginTop: "-2px",
            }}
          >
            26
          </div>

          {/* SIMULATOR lockup */}
          <div className="flex items-center gap-2.5" style={{ marginTop: "8px" }}>
            <div style={{ height: "6px", flex: 1, background: "var(--color-wc-ink)" }} />
            <div
              className="festival-title-sub"
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "clamp(20px, 2.5vw, 34px)",
                letterSpacing: "0.32em",
                color: "var(--color-wc-ink)",
                whiteSpace: "nowrap",
              }}
            >
              SIMULATOR
            </div>
            <div style={{ height: "6px", flex: 1, background: "var(--color-wc-ink)" }} />
          </div>

          {/* Rotating fact */}
          <div className="festival-title-fact flex items-center gap-3" style={{ marginTop: "12px" }}>
            <div style={{ width: "3px", alignSelf: "stretch", background: "var(--color-wc-can-red)", flexShrink: 0 }} />
            <p
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 600,
                fontSize: "12px",
                lineHeight: 1.45,
                letterSpacing: "0.01em",
                color: "var(--color-wc-ink)",
                opacity: 0.75,
              }}
            >
              {facts[factIndex]}
            </p>
          </div>

        </div>

        {/* CTA zone */}
        {!state.active ? (
          <div>
            <button
              onClick={() => {
                startTournament();
                router.push("/groups");
              }}
              disabled={!hydrated}
              className="festival-cta inline-flex w-full items-center justify-center transition-transform ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:justify-start"
              style={{
                background: "var(--color-wc-ink)",
                color: "#fff",
                fontFamily: "var(--font-archivo-black)",
                fontSize: "22px",
                letterSpacing: "0.04em",
                border: "none",
                padding: "20px 40px",
                cursor: "pointer",
                gap: "14px",
                boxShadow: "8px 8px 0 0 var(--color-wc-can-red)",
                transitionDuration: "120ms",
              }}
            >
              {/* CSS triangle play icon */}
              <span
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "10px solid #fff",
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              START
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/groups"
                className="festival-cta-secondary flex items-center transition-transform ease-out hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "16px",
                  background: "#fff",
                  border: "2px solid var(--color-wc-ink)",
                  padding: "14px 22px",
                  color: "var(--color-wc-ink)",
                  transitionDuration: "120ms",
                }}
              >
                VIEW GROUPS
              </Link>
              <Link
                href="/bracket"
                className="festival-cta-secondary flex items-center transition-transform ease-out hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "16px",
                  background: "#fff",
                  border: "2px solid var(--color-wc-ink)",
                  padding: "14px 22px",
                  color: "var(--color-wc-ink)",
                  transitionDuration: "120ms",
                }}
              >
                VIEW BRACKET
              </Link>
              <button
                type="button"
                onClick={() => setShowRestartConfirm(true)}
                disabled={!hydrated}
                className="festival-cta-secondary flex items-center transition-transform ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "16px",
                  background: "#fff",
                  border: "2px solid var(--color-wc-ink)",
                  padding: "14px 22px",
                  color: "var(--color-wc-can-red)",
                  boxShadow: "4px 4px 0 0 var(--color-wc-can-red)",
                  cursor: "pointer",
                  transitionDuration: "120ms",
                }}
              >
                RESTART
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Canada block ─────────────────────────────────────────────── */}
      <div
        className="festival-host relative overflow-hidden text-white"
        style={{ background: "var(--color-wc-can-red)", padding: "22px", gridColumn: "3", gridRow: "1" }}
      >
        <div
          className="festival-host-meta text-right"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            opacity: 0.85,
          }}
        >
          HOST · 02
        </div>
        <div
          className="festival-host-name text-right"
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "clamp(40px, 5vw, 64px)",
            lineHeight: 0.85,
            marginTop: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          CANADA
        </div>
        <div
          className="festival-host-meta text-right"
          style={{
            marginTop: "10px",
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
          }}
        >
          2 CITIES · 13 MATCHES
        </div>
        {/* Canada flag */}
        <span
          className="festival-host-flag fi fi-ca absolute"
          aria-hidden="true"
          style={{
            width: "260px",
            height: "173px",
            left: "-90px",
            top: "50%",
            transform: "translateY(-50%) rotate(-8deg)",
            opacity: 0.7,
            backgroundSize: "cover",
            border: "4px solid #fff",
          }}
        />
      </div>

      {/* ── 4. USA block ────────────────────────────────────────────────── */}
      <div
        className="festival-host relative overflow-hidden text-white"
        style={{ background: "#002868", padding: "22px", gridColumn: "1", gridRow: "2" }}
      >
        <div
          className="festival-host-meta"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            opacity: 0.85,
          }}
        >
          HOST · 03
        </div>
        <div
          className="festival-host-name"
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "clamp(32px, 3.5vw, 48px)",
            lineHeight: 0.85,
            marginTop: "8px",
            letterSpacing: "-0.02em",
          }}
        >
          UNITED
          <br />
          STATES
        </div>
        <div
          className="festival-host-meta"
          style={{
            marginTop: "10px",
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
          }}
        >
          11 CITIES · 78 MATCHES
        </div>
        {/* USA flag */}
        <span
          className="festival-host-flag fi fi-us absolute"
          aria-hidden="true"
          style={{
            width: "260px",
            height: "173px",
            right: "-90px",
            top: "50%",
            transform: "translateY(-50%) rotate(8deg)",
            opacity: 0.7,
            backgroundSize: "cover",
            border: "4px solid #fff",
          }}
        />
      </div>

      {/* ── 5. Stats block ──────────────────────────────────────────────── */}
      <div
        className="festival-stats flex flex-col items-center justify-center"
        style={{
          background: "var(--color-wc-cream)",
          border: "3px solid var(--color-wc-ink)",
          padding: "26px",
          gridColumn: "3",
          gridRow: "2",
        }}
      >
        <div
          className="festival-stats-eyebrow"
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            opacity: 0.6,
            color: "var(--color-wc-ink)",
            marginBottom: "18px",
          }}
        >
          BY THE NUMBERS
        </div>
        <div
          className="w-full max-w-sm"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}
        >
          <StatCard n="48" label="NATIONS" />
          <StatCard n="12" label="GROUPS" />
          <StatCard n="104" label="MATCHES" />
          <StatCard n="16" label="CITIES" />
        </div>
      </div>

      {/* ── 6. Ticker ───────────────────────────────────────────────────── */}
      <Ticker teams={tickerTeams} />

      {/* ── Restart confirmation modal ───────────────────────────────────── */}
      {showRestartConfirm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="restart-title"
        >
          <div
            className="w-full max-w-md bg-white p-6 text-left"
            style={{ border: "3px solid var(--color-wc-ink)", boxShadow: "8px 8px 0 0 var(--color-wc-can-red)" }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.24em",
                    marginBottom: "8px",
                    color: "var(--color-wc-can-red)",
                  }}
                >
                  DESTRUCTIVE ACTION
                </p>
                <h2
                  id="restart-title"
                  style={{
                    fontFamily: "var(--font-archivo-black)",
                    fontSize: "28px",
                    lineHeight: 1.1,
                    color: "var(--color-wc-ink)",
                  }}
                >
                  RESTART TOURNAMENT?
                </h2>
              </div>
              <button
                type="button"
                aria-label="Cancel restart"
                onClick={() => setShowRestartConfirm(false)}
                className="transition-colors hover:opacity-60"
                style={{ color: "var(--color-wc-ink)" }}
              >
                <X className="size-5" />
              </button>
            </div>

            <p
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "var(--color-wc-ink)",
                opacity: 0.7,
              }}
            >
              This will erase the current simulation progress and generate a fresh set of groups
              and matches.
            </p>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowRestartConfirm(false)}
                className="px-5 py-3 transition-colors hover:bg-gray-50"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                  color: "var(--color-wc-ink)",
                  border: "2px solid var(--color-wc-ink)",
                  background: "#fff",
                }}
              >
                KEEP CURRENT
              </button>
              <button
                type="button"
                onClick={confirmRestart}
                disabled={!hydrated}
                className="px-5 py-3 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                  color: "#fff",
                  background: "var(--color-wc-can-red)",
                  border: "2px solid var(--color-wc-can-red)",
                }}
              >
                RESTART NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
