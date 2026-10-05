import { SITE } from "@/lib/site";

export default function manifest() {
  return {
    name: SITE,
    short_name: SITE,
    start_url: "/",
    display: "standalone",
    dir: "rtl",
    lang: "ar",
    background_color: "#030816",
    theme_color: "#030816",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
