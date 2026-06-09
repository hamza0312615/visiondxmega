import { getApiKey, saveResult } from './localStorage'

/**
 * Checks if all possible AI API keys are missing.
 * @returns {boolean} True if no Groq or Gemini key is found.
 */
export function isApiKeyMissing() {
  const hasKey = getApiKey() || localStorage.getItem('visiondx_gemini_key')
  return !hasKey
}

/**
 * Executes the simulated fallback mode.
 * @param {Object} options - Fallback options.
 * @param {string} options.type - The result type (e.g., 'skin', 'hair').
 * @param {Object} options.fallbackResult - The data to save.
 * @param {Function} options.onComplete - Callback with the saved result.
 * @param {number} [options.delay=1500] - Simulated delay in ms.
 */
export function executeFallback({ type, fallbackResult, onComplete, delay = 1500 }) {
  setTimeout(() => {
    const saved = saveResult(type, fallbackResult)

    if (onComplete) {
      onComplete(saved)
    }

    if (localStorage.getItem('visiondx_autopilot') === 'active') {
      window.dispatchEvent(
        new CustomEvent('autopilot-result-ready', {
          detail: { type, result: saved },
        })
      )
    }
  }, delay)
}
