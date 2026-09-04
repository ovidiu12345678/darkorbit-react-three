import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/darkorbit-react-three/",
  plugins: [react()],
});
