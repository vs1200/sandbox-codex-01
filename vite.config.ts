import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { qrcode } from "vite-plugin-qrcode";

// GitHub Pages 用の base path。CI からは VITE_BASE で上書きし、
// PR プレビューではサブディレクトリを差し込めるようにする。
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  plugins: [react(), tailwindcss(), qrcode()],
  base,
  server: {
    // LAN 内の他端末 (スマホ等) からのアクセスを許可
    host: true,
  },
});
