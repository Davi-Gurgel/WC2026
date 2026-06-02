import { useEffect, useRef, type RefObject } from "react";
import confetti from "canvas-confetti";

export function useChampionCelebration(championId: string | null, championRef: RefObject<HTMLElement | null>) {
  const lastCelebratedChampion = useRef<string | null>(null);

  useEffect(() => {
    if (!championId) {
      lastCelebratedChampion.current = null;
      return;
    }
    if (lastCelebratedChampion.current === championId) return;
    lastCelebratedChampion.current = championId;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    window.setTimeout(() => {
      championRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center"
      });
    }, 120);

    if (reduceMotion) return;

    const colors = ["#D52B1E", "#002868", "#006847", "#fefaf0", "#FFD700"];
    const fire = (particleRatio: number, opts: confetti.Options) => {
      void confetti({
        origin: { y: 0.7 },
        colors,
        zIndex: 9999,
        ...opts,
        particleCount: Math.floor(220 * particleRatio)
      });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    window.setTimeout(() => {
      void confetti({
        particleCount: 90,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.9 },
        colors,
        zIndex: 9999
      });
      void confetti({
        particleCount: 90,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.9 },
        colors,
        zIndex: 9999
      });
    }, 400);
  }, [championId, championRef]);
}
