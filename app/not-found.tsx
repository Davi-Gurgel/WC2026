import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-[calc(100dvh-57px)] flex-1 items-center justify-center px-6 py-20 text-center">
      <section className="w-full max-w-lg border border-wc-ink/10 bg-wc-paper p-8">
        <AlertTriangle className="mx-auto mb-5 size-8 text-wc-red" aria-hidden="true" />
        <p className="label-micro tracking-[0.3em] text-wc-red">404</p>
        <h1 className="mt-3 font-outfit text-3xl font-black uppercase tracking-tight text-wc-ink">
          Page not found
        </h1>
        <p className="mt-4 font-mono text-xs leading-relaxed text-wc-ink/50">
          The requested simulator route does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex border border-wc-ink/20 bg-wc-ink/5 px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-wc-ink transition-colors hover:bg-wc-ink hover:text-wc-cream"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
