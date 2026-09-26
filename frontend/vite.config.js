import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      // Serve the hero video same-origin so the light-mode canvas keyer
      // is allowed to read its pixels (no CORS tainting).
      "/cdn/hero.mp4": {
        target: "https://d8j0ntlcm91z4.cloudfront.net",
        changeOrigin: true,
        rewrite: () =>
          "/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260808_112712_da9d53df-6d27-4b12-bdf6-aa9dc2622bdf.mp4",
      },
    },
  },
});
