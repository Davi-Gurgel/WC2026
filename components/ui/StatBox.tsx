import { cn } from "@/lib/utils";

export function StatBox({
  value,
  label,
  className,
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn("bg-white px-3 py-3 sm:px-4 sm:py-4", className)}
      style={{ border: "2px solid #0d0d10" }}
    >
      <div
        style={{
          fontFamily: "var(--font-archivo-black)",
          fontSize: "clamp(32px, 5vw, 48px)",
          lineHeight: 0.9,
          letterSpacing: "-0.04em",
          color: "#0d0d10",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--font-jetbrains-mono)",
          fontSize: "10px",
          letterSpacing: "0.22em",
          color: "#0d0d10",
          opacity: 0.55,
          marginTop: "4px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
}
