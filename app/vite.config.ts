import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // The Solana and Anchor libraries were written for Node.js and expect a global `Buffer`.
    // Browsers do not have one, so this plugin adds it.
    nodePolyfills({ include: ['buffer'], globals: { Buffer: true } }),
  ],
  build: {
    // The Solana libraries are large (about 1 MB before compression). That is expected.
    chunkSizeWarningLimit: 2000,
  },
});
