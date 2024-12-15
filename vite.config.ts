import { defineConfig, Plugin } from "vite";
import nodePolyfills from "rollup-plugin-node-polyfills";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      ...(nodePolyfills() as unknown as Plugin),
      enforce: "post",
    },
  ],
  resolve: {
    alias: {
      crypto: "rollup-plugin-node-polyfills/polyfills/crypto-browserify",
    },
  },
});
