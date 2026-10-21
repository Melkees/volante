import fs from "node:fs"
import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

/** Injeta <link rel="preload"> das duas fontes críticas após o build (hashes mudam a cada build). */
function fontPreload(): Plugin {
  return {
    name: "volante-font-preload",
    apply: "build",
    closeBundle() {
      const assetsDir = path.resolve(__dirname, "dist/assets")
      const assets = fs.readdirSync(assetsDir)
      const pick = (re: RegExp) => assets.find((a) => re.test(a))
      const fonts = [
        pick(/fraunces-latin-500-normal-.*\.woff2/),
        pick(/inter-latin-400-normal-.*\.woff2/),
      ].filter(Boolean)
      if (!fonts.length) return
      const index = path.resolve(__dirname, "dist/index.html")
      let html = fs.readFileSync(index, "utf8")
      const links = fonts
        .map((f) => `<link rel="preload" as="font" type="font/woff2" href="/assets/${f}" crossorigin />`)
        .join("\n    ")
      html = html.replace("</title>", `</title>\n    ${links}`)
      fs.writeFileSync(index, html)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [tailwindcss(), react(), fontPreload()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // separa vendors pesados em chunks próprios: melhor cache e download paralelo
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-motion': ['framer-motion'],
          'vendor-radix': [
            '@radix-ui/react-slider',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-dialog',
            'cmdk',
          ],
        },
      },
    },
  },
});
