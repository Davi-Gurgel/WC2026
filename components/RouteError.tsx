"use client";

export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main
      className="flex flex-1 items-center justify-center px-6 py-16"
      style={{ background: "var(--color-wc-cream)" }}
    >
      <section
        className="w-full max-w-lg text-center"
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
            marginBottom: "12px",
          }}
        >
          ERROR
        </div>
        <h1
          style={{
            fontFamily: "var(--font-archivo-black)",
            fontSize: "32px",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--color-wc-ink)",
          }}
        >
          SOMETHING WENT WRONG
        </h1>
        <p
          className="mt-4"
          style={{
            fontFamily: "var(--font-space-grotesk)",
            fontSize: "14px",
            lineHeight: 1.55,
            color: "var(--color-wc-ink)",
            opacity: 0.6,
          }}
        >
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred while rendering this view."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex items-center transition-transform hover:-translate-y-0.5"
          style={{
            background: "var(--color-wc-ink)",
            color: "#fff",
            fontFamily: "var(--font-archivo-black)",
            fontSize: "14px",
            letterSpacing: "0.04em",
            border: "none",
            padding: "12px 22px",
            cursor: "pointer",
            boxShadow: "4px 4px 0 0 var(--color-wc-can-red)",
            transitionDuration: "120ms",
          }}
        >
          TRY AGAIN
        </button>
      </section>
    </main>
  );
}
