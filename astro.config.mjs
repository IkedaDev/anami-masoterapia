import { defineConfig } from "astro/config";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve("./src"),
      },
    },
  },

  integrations: [mdx(), sitemap(), react()],
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
});
