import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AquaPulse Field",
    short_name: "AquaPulse",
    description: "Integrated farm records and field capture",
    start_url: "/farming",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#0d3d31",
    icons: [
      {
        src: "/farm-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
