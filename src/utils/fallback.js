import { getApiKey, saveResult } from './localStorage'

/**
 * Checks if any valid API key (Groq or Gemini) is present.
 * @returns {boolean}
 */
export function hasAnyApiKey() {
  return !!(getApiKey() || localStorage.getItem('visiondx_gemini_key'))
}

/**
 * Executes the simulated fallback logic: delay, saveResult, update state, and dispatch autopilot events.
 *
 * @param {Object} options - Configuration for fallback.
 * @param {string} options.type - Result type for saveResult (e.g., 'sleep', 'skin').
 * @param {Object} options.fallbackResult - The result data to save.
 * @param {Function} options.setLoading - Callback to update loading state.
 * @param {Function} options.setCurrentResult - Callback to update current result state.
 * @param {Function} [options.onSuccess] - Optional callback called with the saved result.
 * @param {number} [options.delay=1500] - Simulation delay in milliseconds.
 */
export function triggerFallbackMode({
  type,
  fallbackResult,
  setLoading,
  setCurrentResult,
  onSuccess,
  delay = 1500
}) {
  setTimeout(() => {
    const saved = saveResult(type, fallbackResult)
    setCurrentResult(saved)
    setLoading(false)

    if (onSuccess) {
      onSuccess(saved)
    }

    if (localStorage.getItem('visiondx_autopilot') === 'active') {
      window.dispatchEvent(new CustomEvent('autopilot-result-ready', {
        detail: { type, result: saved }
      }))
    }
  }, delay)
}
