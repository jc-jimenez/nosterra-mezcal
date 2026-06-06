import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AgeGate } from "@/components/layout/AgeGate";
import { ConvexClientProvider } from "./ConvexClientProvider";

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
  metadataBase: new URL("https://www.nosterramezcal.com"),
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
    url: "https://www.nosterramezcal.com",
    siteName: "NOSTERRA Mezcal",
    type: "website",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOSTERRA Mezcal",
    description:
      "Mezcal artesanal oaxaqueño. El espíritu de nuestra tierra, en cada gota.",
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
        <ConvexClientProvider>
          <AgeGate />
          {children}
        </ConvexClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
