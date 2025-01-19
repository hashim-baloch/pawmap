import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/stray-animal-tracker/", // Replace with your repo name
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "leaflet-vendor": ["leaflet", "leaflet-draw", "react-leaflet"],
        },
      },
    },
  },
});
