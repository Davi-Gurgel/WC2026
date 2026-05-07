"use client";

import { useState, useEffect } from "react";

export function FactCycler({ facts }: { facts: string[] }) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setFactIndex((current) => (current + 1) % facts.length), 6000);
    return () => window.clearInterval(timer);
  }, [facts]);

  return (
    <div className="mt-8 flex max-w-lg items-start gap-3 text-left">
      <span className="font-mono text-gold-light mt-[2px] opacity-70">[</span>
      <p className="text-sm text-white/70 leading-relaxed font-mono">
        {facts[factIndex]}
      </p>
      <span className="font-mono text-gold-light mt-[2px] opacity-70">]</span>
    </div>
  );
}
