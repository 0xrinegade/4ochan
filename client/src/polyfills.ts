/**
 * Node.js environment polyfills for browser compatibility
 * This file must be imported before any other modules that depend on these globals
 */

// Polyfill global object if it doesn't exist
if (typeof window !== 'undefined') {
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
  
  // Provide minimal process.env to avoid errors
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
  }
  
  // Simple Buffer polyfill for minimal compatibility
  if (typeof window.Buffer === 'undefined') {
    // Minimal Buffer API implementation for browser compatibility
    window.Buffer = {
      from: (input: string | ArrayBuffer | ArrayBufferView, encoding?: string): Uint8Array => {
        if (typeof input === 'string') {
          return new TextEncoder().encode(input);
        } else if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
          return new Uint8Array(input);
        }
        return new Uint8Array();
      },
      isBuffer: (obj: any): boolean => false,
      alloc: (size: number): Uint8Array => new Uint8Array(size),
      // Add toString method for conversion back to string
      toString: (buffer: Uint8Array, encoding?: string): string => {
        return new TextDecoder().decode(buffer);
      }
    } as any;
  }
}