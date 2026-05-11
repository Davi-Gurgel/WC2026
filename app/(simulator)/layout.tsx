import { TournamentProvider } from "@/components/TournamentProvider";

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return <TournamentProvider>{children}</TournamentProvider>;
}
