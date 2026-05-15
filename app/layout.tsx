import type { Metadata } from "next";
import { Geist, Outfit, Archivo_Black, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/Nav";
import "flag-icons/css/flag-icons.min.css";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit-display" });
const archivoBlack = Archivo_Black({ subsets: ["latin"], weight: "400", variable: "--font-archivo-black" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains-mono" });

export const metadata: Metadata = {
  title: "WC26 Simulator",
  description: "Advanced simulator for the 2026 World Cup"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${geist.variable} ${outfit.variable} ${archivoBlack.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="antialiased min-h-dvh flex flex-col relative">
        <Nav />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
