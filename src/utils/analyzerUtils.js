import { getApiKey, saveResult } from './localStorage'

/**
 * Checks if any valid API key (Groq or Gemini) is available.
 * @returns {boolean}
 */
export function hasAnyApiKey() {
  const groqKey = getApiKey()
  const geminiKey = localStorage.getItem('visiondx_gemini_key') || (import.meta.env ? import.meta.env.VITE_GEMINI_API_KEY : '')
  return !!(groqKey || geminiKey)
}

/**
 * Handles the simulation fallback logic when API keys are missing.
 * Encapsulates setTimeout, saveResult, state updates, and autopilot event dispatch.
 *
 * @param {Object} params
 * @param {string} params.type - The module type (e.g., 'lab', 'skin')
 * @param {Object} params.fallbackResult - The data to be saved and displayed
 * @param {Function} params.setLoading - React state setter for loading status
 * @param {Function} params.setCurrentResult - React state setter for the current analysis result
 * @param {Function} [params.onComplete] - Optional callback to run after fallback is processed
 * @param {number} [params.delay=1500] - Delay in milliseconds
 */
export function handleSimulationFallback({
  type,
  fallbackResult,
  setLoading,
  setCurrentResult,
  onComplete = null,
  delay = 1500
}) {
  setTimeout(() => {
    const saved = saveResult(type, fallbackResult)
    setCurrentResult(saved)
    setLoading(false)

    if (localStorage.getItem('visiondx_autopilot') === 'active') {
      window.dispatchEvent(
        new CustomEvent('autopilot-result-ready', {
          detail: { type, result: saved }
        })
      )
    }

    if (onComplete) {
      onComplete(saved)
    }
  }, delay)
}
