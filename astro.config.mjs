import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // Reemplaza esto con la URL real cuando compres el dominio
  // site: "https://anamimasoterapia.cl",

  // Genera automáticamente el sitemap.xml para Google
  integrations: [sitemap()],

  build: {
    // Optimización de assets
    inlineStylesheets: "auto",
  },
});
