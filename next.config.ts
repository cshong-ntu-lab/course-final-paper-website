import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

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

export default withSentryConfig(nextConfig, {
  // Source maps upload — only active when SENTRY_AUTH_TOKEN is set (CI/CD)
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Disable source map upload unless SENTRY_AUTH_TOKEN provided
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  // Suppress build-time Sentry warnings when DSN is not set locally
  disableLogger: true,
  // Avoid adding server-side Sentry auto-instrumentation noise
  autoInstrumentServerFunctions: false,
});
