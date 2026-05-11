import { cn } from "@/lib/utils";

export function StatBox({ value, label, className }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={cn("bg-navy p-6", className)}>
      <div className="font-outfit text-3xl font-black text-white">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</div>
    </div>
  );
}