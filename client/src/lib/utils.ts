import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Truncates a string to the specified length and adds ellipsis if truncated
 * @param text The string to truncate
 * @param length The maximum length before truncation
 * @returns The truncated string with ellipsis if needed
 */
export function truncate(text: string, length: number = 30): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}
