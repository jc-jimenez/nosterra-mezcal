import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { AgeGate } from "@/components/layout/AgeGate";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const body = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NOSTERRA Mezcal · Joven Cristalino de Santiago Matatlán, Oaxaca",
  description:
    "Mezcal artesanal oaxaqueño de Casa Jiménez Elixirs & Spirits. Agave Espadín, tahona de piedra y alambique de cobre. La distancia puede separar caminos… pero nunca nuestras raíces.",
  keywords: [
    "mezcal artesanal",
    "mezcal oaxaca",
    "Santiago Matatlán",
    "agave espadín",
    "NOSTERRA",
    "Casa Jiménez Elixirs",
  ],
  openGraph: {
    title: "NOSTERRA Mezcal",
    description:
      "Mezcal artesanal oaxaqueño. El espíritu de nuestra tierra, en cada gota.",
    type: "website",
    locale: "es_MX",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-obsidian text-ivory font-body">
        <AgeGate />
        {children}
      </body>
    </html>
  );
}
