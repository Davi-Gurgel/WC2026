"use client";

import Link from "next/link";
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
      className="bg-white transition-transform ease-out hover:-translate-y-0.5"
      style={{ border: "2px solid #0d0d10", padding: "10px 12px", transitionDuration: "120ms" }}
    >
      <div
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "56px",
          lineHeight: 0.9,
          color: "#0d0d10",
          letterSpacing: "-0.04em",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "10px",
          letterSpacing: "0.22em",
          color: "#0d0d10",
          opacity: 0.55,
          marginTop: "4px",
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
      style={{ background: "#0d0d10", gridColumn: "1 / 4", gridRow: "3" }}
    >
      {/* Left badge */}
      <div
        className="flex flex-shrink-0 items-center self-stretch z-10"
        style={{
          background: "#D52B1E",
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
          className="wc-ticker-inner flex items-center"
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
        className="relative overflow-hidden text-white"
        style={{ background: "#006847", padding: "22px", gridColumn: "1", gridRow: "1" }}
      >
        <div
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
          className="fi fi-mx absolute"
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
        className="relative overflow-hidden flex flex-col justify-between"
        style={{
          background: "#fefaf0",
          border: "3px solid #0d0d10",
          padding: "32px 36px",
          gridColumn: "2",
          gridRow: "1 / 3",
        }}
      >
        {/* Top tag row */}
        <div className="flex items-center gap-2.5">
          <div
            style={{
              background: "#D52B1E",
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
              color: "#0d0d10",
            }}
          >
            FINAL · JUL 19 · METLIFE
          </div>
        </div>

        {/* Title stack */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "clamp(64px, 9vw, 116px)",
              lineHeight: 0.82,
              letterSpacing: "-0.04em",
              color: "#0d0d10",
            }}
          >
            WORLD
          </div>
          <div
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
            style={{
              fontFamily: "var(--font-archivo-black)",
              fontSize: "clamp(88px, 13vw, 170px)",
              lineHeight: 0.8,
              letterSpacing: "-0.05em",
              color: "#D52B1E",
              marginTop: "-2px",
            }}
          >
            26
          </div>

          {/* SIMULATOR lockup */}
          <div className="flex items-center gap-2.5" style={{ marginTop: "8px" }}>
            <div style={{ height: "6px", flex: 1, background: "#0d0d10" }} />
            <div
              style={{
                fontFamily: "var(--font-archivo-black)",
                fontSize: "clamp(20px, 2.5vw, 34px)",
                letterSpacing: "0.32em",
                color: "#0d0d10",
                whiteSpace: "nowrap",
              }}
            >
              SIMULATOR
            </div>
            <div style={{ height: "6px", flex: 1, background: "#0d0d10" }} />
          </div>

          {/* Rotating fact */}
          <div className="flex items-center gap-3" style={{ marginTop: "12px" }}>
            <div style={{ width: "3px", alignSelf: "stretch", background: "#D52B1E", flexShrink: 0 }} />
            <p
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 600,
                fontSize: "12px",
                lineHeight: 1.45,
                letterSpacing: "0.01em",
                color: "#0d0d10",
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
              onClick={startTournament}
              disabled={!hydrated}
              className="flex items-center transition-transform ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#0d0d10",
                color: "#fff",
                fontFamily: "var(--font-archivo-black)",
                fontSize: "22px",
                letterSpacing: "0.04em",
                border: "none",
                padding: "20px 40px",
                cursor: "pointer",
                gap: "14px",
                boxShadow: "8px 8px 0 0 #D52B1E",
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
                className="flex items-center transition-transform ease-out hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "16px",
                  background: "#fff",
                  border: "2px solid #0d0d10",
                  padding: "14px 22px",
                  color: "#0d0d10",
                  transitionDuration: "120ms",
                }}
              >
                VIEW GROUPS
              </Link>
              <Link
                href="/bracket"
                className="flex items-center transition-transform ease-out hover:-translate-y-0.5"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "16px",
                  background: "#fff",
                  border: "2px solid #0d0d10",
                  padding: "14px 22px",
                  color: "#0d0d10",
                  transitionDuration: "120ms",
                }}
              >
                VIEW BRACKET
              </Link>
              <button
                type="button"
                onClick={() => setShowRestartConfirm(true)}
                disabled={!hydrated}
                className="flex items-center transition-transform ease-out hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-archivo-black)",
                  fontSize: "16px",
                  background: "#fff",
                  border: "2px solid #0d0d10",
                  padding: "14px 22px",
                  color: "#D52B1E",
                  boxShadow: "4px 4px 0 0 #D52B1E",
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
        className="relative overflow-hidden text-white"
        style={{ background: "#D52B1E", padding: "22px", gridColumn: "3", gridRow: "1" }}
      >
        <div
          className="text-right"
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
          className="text-right"
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
          className="text-right"
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
          className="fi fi-ca absolute"
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
        className="relative overflow-hidden text-white"
        style={{ background: "#002868", padding: "22px", gridColumn: "1", gridRow: "2" }}
      >
        <div
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
          className="fi fi-us absolute"
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
        className="flex flex-col justify-between"
        style={{
          background: "#fefaf0",
          border: "3px solid #0d0d10",
          padding: "22px",
          gridColumn: "3",
          gridRow: "2",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: "10px",
            letterSpacing: "0.24em",
            opacity: 0.6,
            color: "#0d0d10",
          }}
        >
          BY THE NUMBERS
        </div>
        <p
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontWeight: 500,
            fontSize: "14px",
            lineHeight: 1.55,
            color: "#0d0d10",
            opacity: 0.55,
          }}
        >
          The biggest World Cup in history — first edition with 48 nations across 3 host countries.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
            style={{ border: "3px solid #0d0d10", boxShadow: "8px 8px 0 0 #D52B1E" }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains-mono)",
                    fontSize: "10px",
                    letterSpacing: "0.24em",
                    marginBottom: "8px",
                    color: "#D52B1E",
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
                    color: "#0d0d10",
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
                style={{ color: "#0d0d10" }}
              >
                <X className="size-5" />
              </button>
            </div>

            <p
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "14px",
                lineHeight: 1.6,
                color: "#0d0d10",
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
                  color: "#0d0d10",
                  border: "2px solid #0d0d10",
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
                  background: "#D52B1E",
                  border: "2px solid #D52B1E",
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
