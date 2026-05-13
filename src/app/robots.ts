import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  if (env.isStaging) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/sitemap.xml`,
  };
}
