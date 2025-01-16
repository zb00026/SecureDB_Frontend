import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { PluginOption, defineConfig, loadEnv } from "vite";
import { ViteAliases } from "vite-aliases";
import router from "vite-plugin-react-views";
import tsconfigPaths from "vite-tsconfig-paths";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return defineConfig({
    server: {
      hmr: true,
      cors: true,
      proxy: {
        "/api": {
          target: env.VITE_SERVER_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
          // rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    plugins: [
      react(),
      router(),
      tsconfigPaths(),
      ViteAliases({
        useConfig: true,
      }),
      // vitePluginFaviconsInject("./src/logo.svg"),
      visualizer({
        template: "treemap", // or sunburst
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: "analyse.html", // will be saved in project's root
      }) as PluginOption,
    ],
    define: { "process.env": {} },
    css: {
      preprocessorOptions: {
        
      },
    },
  });
};
