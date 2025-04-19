/// <reference types="vite/client" />

// Define the global type extensions
interface Window {
  global: typeof globalThis;
  Buffer: any;
  process: any;
}

declare module 'buffer' {
  export const Buffer: any;
}