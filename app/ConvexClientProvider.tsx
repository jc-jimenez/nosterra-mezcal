"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

// URL del deployment de Convex. En local se toma de .env.local (deployment dev);
// en producción cae al deployment prod. El URL es público (NEXT_PUBLIC), no secreto.
const envUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const CONVEX_URL =
  envUrl && envUrl.startsWith("http")
    ? envUrl
    : "https://robust-guanaco-281.convex.cloud";

const convex = new ConvexReactClient(CONVEX_URL);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
