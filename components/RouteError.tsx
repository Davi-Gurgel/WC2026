"use client";

import { AlertTriangle } from "lucide-react";

export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20 text-center">
      <section className="w-full max-w-lg border border-wc-red/40 bg-navy-panel/60 p-8">
        <AlertTriangle className="mx-auto mb-5 size-8 text-wc-red" aria-hidden="true" />
        <p className="label-micro tracking-[0.3em] text-wc-red">Error</p>
        <h1 className="mt-3 font-outfit text-3xl font-black uppercase tracking-tight text-white">
          Something went wrong
        </h1>
        <p className="mt-4 font-mono text-xs leading-relaxed text-white/55">
          {error.message || "An unexpected error occurred while rendering this view."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 border border-glass-border bg-white/5 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-navy"
        >
          Try Again
        </button>
      </section>
    </main>
  );
}