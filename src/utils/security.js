/**
 * Escapes special characters for use in HTML to prevent XSS attacks.
 * @param {any} str - The string (or other value) to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
