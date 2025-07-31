// utils/calendarUtils.js

/**
 * Rounds a date to the nearest 15-minute interval.
 * @param {Date|string} date
 * @returns {Date|null}
 */
function roundToNearest15(date) {
  if (!date || isNaN(new Date(date).getTime())) return null;
  const d = new Date(date);
  const minutes = Math.round(d.getMinutes() / 15) * 15;
  d.setMinutes(minutes, 0, 0);
  return d;
}

/**
 * Rounds a date down to the nearest 15-minute interval.
 * @param {Date|string} date
 * @returns {Date}
 */
function floorTo15(date) {
  const d = new Date(date);
  const minutes = Math.floor(d.getMinutes() / 15) * 15;
  d.setMinutes(minutes, 0, 0);
  return d;
}

/**
 * Rounds a date up to the nearest 15-minute interval.
 * @param {Date|string} date
 * @returns {Date}
 */
function ceilTo15(date) {
  const d = new Date(date);
  const minutes = Math.ceil(d.getMinutes() / 15) * 15;
  d.setMinutes(minutes, 0, 0);
  return d;
}

/**
 * Checks if a date falls exactly on a 15-minute boundary.
 * @param {Date} date
 * @returns {boolean}
 */
function isMultiple15(date) {
  return date.getMinutes() % 15 === 0;
}

/**
 * Converts a Date to a local ISO string without the 'Z' UTC suffix.
 * @param {Date} date
 * @returns {string}
 */
function toLocalISOString(date) {
  const pad = (num) => num.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":00"
  );
}

export {
  roundToNearest15,
  floorTo15,
  ceilTo15,
  isMultiple15,
  toLocalISOString,
};
