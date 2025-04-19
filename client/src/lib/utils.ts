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

/**
 * Formats a timestamp into a human-readable relative time string
 * @param timestamp The UNIX timestamp in milliseconds or seconds
 * @returns A formatted string like "2 hours ago", "5 minutes ago", etc.
 */
export function formatRelativeTime(timestamp: number): string {
  // Make sure timestamp is in milliseconds
  const normalizedTimestamp = timestamp > 10000000000 ? timestamp : timestamp * 1000;
  const date = new Date(normalizedTimestamp);
  
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Define time intervals in seconds
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  };
  
  // Display "just now" for very recent posts
  if (secondsAgo < 10) {
    return 'just now';
  }
  
  // Find the appropriate time unit
  if (secondsAgo < 60) {
    return `${secondsAgo} seconds ago`;
  } else if (secondsAgo < 3600) {
    const minutes = Math.floor(secondsAgo / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (secondsAgo < 86400) {
    const hours = Math.floor(secondsAgo / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (secondsAgo < 604800) {
    const days = Math.floor(secondsAgo / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (secondsAgo < 2592000) {
    const weeks = Math.floor(secondsAgo / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (secondsAgo < 31536000) {
    const months = Math.floor(secondsAgo / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(secondsAgo / 31536000);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}
