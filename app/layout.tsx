import type { Metadata } from "next";
import "./globals.css";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Demo Técnica | Extracción Inteligente de Datos con IA Visual",
  description: "Demostración técnica de sistema de análisis visual automatizado mediante inteligencia artificial. Extracción estructurada de datos desde imágenes.",
  metadataBase: new URL("https://example.com"),
  robots: { index: false }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-ink-900">
      <body className={`${manrope.className} bg-ink-900 text-slate-100 antialiased`}>{children}</body>
    </html>
  );
}
