// src/utils/calendarUtils.js
// Utility functions for calendar time handling

/**
 * Rounds a date to the nearest 15-minute interval
 */
export function roundToNearest15(date) {
  if (!date) return date;
  const d = new Date(date);
  const minutes = d.getMinutes();
  const rounded = Math.round(minutes / 15) * 15;
  d.setMinutes(rounded, 0, 0);
  return d;
}

/**
 * Floors a date to the previous 15-minute interval
 */
export function floorTo15(date) {
  if (!date) return date;
  const d = new Date(date);
  const minutes = d.getMinutes();
  const floored = Math.floor(minutes / 15) * 15;
  d.setMinutes(floored, 0, 0);
  return d;
}

/**
 * Ceils a date to the next 15-minute interval
 */
export function ceilTo15(date) {
  if (!date) return date;
  const d = new Date(date);
  const minutes = d.getMinutes();
  const ceiled = Math.ceil(minutes / 15) * 15;
  d.setMinutes(ceiled, 0, 0);
  return d;
}

/**
 * CRITICAL FIX: Converts a Date to ISO string preserving LOCAL time as if it were UTC
 * This prevents double timezone conversion when saving to Supabase
 * 
 * Problem: When you drag a task at 2:00 PM local time:
 * - JavaScript Date object represents 2:00 PM in local timezone
 * - .toISOString() converts to UTC (e.g., 6:00 PM UTC if you're UTC-4)
 * - Supabase stores as 6:00 PM
 * - When you read it back, it shows as 2:00 PM again (but stored as 6:00 PM UTC)
 * - On next drag, it uses the 6:00 PM time, making it appear to jump
 * 
 * Solution: Store the LOCAL time as-is without timezone conversion
 */
export function toLocalISOString(date) {
  if (!date) return null;
  
  // If it's already a string, parse it first
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // Get the local time components
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  
  // Format as ISO string but treat local time as UTC
  // This way, 2:00 PM local becomes "2024-01-15T14:00:00.000Z" in the database
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Formats a date for display in the calendar
 */
export function formatTimeForDisplay(date) {
  if (!date) return '';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parses a time string (HH:mm) and combines it with a date
 */
export function parseTimeString(timeStr, baseDate = new Date()) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
}



/**
 * Checks if a date falls exactly on a 15-minute boundary.
 * @param {Date} date
 * @returns {boolean}
 */
export function isMultiple15(date) {
  return date.getMinutes() % 15 === 0;
}



