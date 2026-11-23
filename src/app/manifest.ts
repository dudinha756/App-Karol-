import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Forma Day",
    short_name: "Forma Day",
    description: "Alimentação, treinos e evolução em um só lugar.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#8454f5",
    lang: "pt-BR",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ]
  };
}
