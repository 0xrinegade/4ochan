// Browser polyfills for Node.js environment compatibility

// Global object polyfill
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}

// Process polyfill
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

// Basic Buffer polyfill (minimal implementation)
if (typeof window !== 'undefined' && typeof window.Buffer === 'undefined') {
  window.Buffer = {
    from: (value: string, encoding?: string): Uint8Array => {
      if (typeof value === 'string') {
        return new TextEncoder().encode(value);
      }
      return new Uint8Array();
    },
    isBuffer: (obj: any): boolean => {
      return false;
    },
    alloc: (size: number): Uint8Array => {
      return new Uint8Array(size);
    }
  } as any;
}