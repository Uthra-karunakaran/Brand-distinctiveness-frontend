import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The scoring API sends no Access-Control-Allow-Origin, so a browser on the
// Vite origin cannot call it directly — every request dies as a CORS failure
// before it reaches the network. Proxying through the dev server makes the
// calls same-origin, which sidesteps CORS entirely without touching the API.
//
// src/api.js therefore defaults to the relative base "/api". Override with
// VITE_API_BASE for a build served somewhere the proxy does not exist (that
// deployment needs CORS configured on the API instead).
const API_TARGET = process.env.VITE_API_TARGET ?? 'http://127.0.0.1:8000'


// Same story for the image classifier's search API (src/lib/classifierApi.js),
// a separate service on its own port.
const CLASSIFIER_API_TARGET = process.env.VITE_CLASSIFIER_API_TARGET ?? 'http://127.0.0.1:8002'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/classifier-api': {
        target: CLASSIFIER_API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/classifier-api/, ''),
      },
    },
  },
})
