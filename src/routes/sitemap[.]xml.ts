import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://aura-daily-whispers.lovable.app";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/tarot", changefreq: "daily", priority: "0.9" },
          { path: "/tarot/tek-kart", changefreq: "weekly", priority: "0.9" },
          { path: "/kahve", changefreq: "daily", priority: "0.9" },
          { path: "/mistik", changefreq: "daily", priority: "0.8" },
          { path: "/haftalik", changefreq: "weekly", priority: "0.8" },
          { path: "/aylik", changefreq: "monthly", priority: "0.7" },
          { path: "/dogum-haritasi", changefreq: "monthly", priority: "0.7" },
          { path: "/gezegenler", changefreq: "daily", priority: "0.7" },
          { path: "/ozel-gun", changefreq: "monthly", priority: "0.6" },
          { path: "/stilist", changefreq: "daily", priority: "0.7" },
          { path: "/mektup", changefreq: "weekly", priority: "0.6" },
          { path: "/arsiv", changefreq: "weekly", priority: "0.5" },
          { path: "/arsiv-tas", changefreq: "weekly", priority: "0.5" },
          { path: "/gizlilik", changefreq: "yearly", priority: "0.3" },
          { path: "/guven", changefreq: "yearly", priority: "0.3" },
        ];

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
