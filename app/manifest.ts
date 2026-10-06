import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yes Planner",
    short_name: "Yes Planner",
    description: "Wedding planning and vendor collaboration in one elegant workspace.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdfb",
    theme_color: "#7f3448",
    icons: [
      { src: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
