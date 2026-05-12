import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // typedRoutes disabled during phased build-out (re-enable in Phase 11 polish
  // when all destinations exist). Currently every newly-referenced route would
  // require an `as Route` cast.
  typedRoutes: false,
};

export default nextConfig;
