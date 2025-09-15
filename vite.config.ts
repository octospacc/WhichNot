import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import legacy from "@vitejs/plugin-legacy";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  plugins: [
    preact(),
    legacy({
      targets: ["defaults", "IE 11"],
      additionalLegacyPolyfills: ["regenerator-runtime/runtime"],
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.js",
      injectRegister: false,
      manifest: false,
      includeAssets: ["icon.png", "manifest.json"],
    }),
  ],
  build: {
    target: "esnext",
  },
});
