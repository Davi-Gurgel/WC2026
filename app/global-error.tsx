"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-navy font-geist text-white antialiased">
        <main className="flex min-h-dvh items-center justify-center px-6 py-20 text-center">
          <section className="w-full max-w-lg border border-wc-red/40 bg-navy-panel/60 p-8">
            <AlertTriangle className="mx-auto mb-5 size-8 text-wc-red" aria-hidden="true" />
            <p className="label-micro tracking-[0.3em] text-wc-red">Runtime fault</p>
            <h1 className="mt-3 font-outfit text-3xl font-black uppercase tracking-tight text-white">
              Simulator interrupted
            </h1>
            <p className="mt-4 font-mono text-xs leading-relaxed text-white/55">
              The app hit an unexpected error while rendering this view.
            </p>
            <button
              type="button"
              onClick={() => unstable_retry()}
              className="mt-8 border border-glass-border bg-white/5 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-navy"
            >
              Retry
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
