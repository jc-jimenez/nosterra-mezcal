import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Permite optimizar imágenes alojadas en Convex File Storage
    // (las que se suben desde el panel de administración).
    remotePatterns: [
      { protocol: "https", hostname: "*.convex.cloud" },
    ],
  },
};

export default nextConfig;
