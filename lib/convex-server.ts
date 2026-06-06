import { ConvexHttpClient } from "convex/browser";

const url =
  process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CONVEX_URL.startsWith("http")
    ? process.env.NEXT_PUBLIC_CONVEX_URL
    : "https://robust-guanaco-281.convex.cloud";

// Cliente Convex para uso en el servidor (API routes).
export const convexServer = new ConvexHttpClient(url);
