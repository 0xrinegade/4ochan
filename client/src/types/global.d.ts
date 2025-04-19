// TypeScript declarations for global polyfills
interface Window {
  global: typeof globalThis;
  Buffer: any;
}

// Extend global for Node.js compatibility
declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: any;
  }
}

export {};