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
 * Converts a Date object to a standard ISO 8601 string in UTC.
 * This is the correct way to handle dates with a `TIMESTAMPTZ` database column.
 * The browser and database will handle the UTC-to-local and local-to-UTC conversions.
 */
export function toLocalISOString(date) {
  if (!date) return null;
  // If it's already a string, parse it first to ensure it's a valid Date object
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  // .toISOString() correctly converts the date to a string in the UTC timezone.
  return d.toISOString();
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
