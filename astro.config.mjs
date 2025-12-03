import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  // Reemplaza esto con la URL real cuando compres el dominio
  site: "https://anami.ikedadev.com",

  // Genera automáticamente el sitemap.xml para Google
  integrations: [sitemap(), react()],

  build: {
    // Optimización de assets
    inlineStylesheets: "auto",
  },
});