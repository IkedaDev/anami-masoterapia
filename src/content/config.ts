import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(), // Usado para el excerpt y SEO
    pubDate: z.date(),
    author: z.string().default("Anette Lagos"),
    image: z.string(), // URL de la imagen principal
    category: z.enum(["Bienestar", "Salud", "Tips", "Novedades", "Belleza"]),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  blog: blogCollection,
};
