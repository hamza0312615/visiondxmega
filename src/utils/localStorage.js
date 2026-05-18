const STORAGE_KEY = 'visiondx_mega_history'
const WHATSAPP_KEY = 'visiondx_whatsapp_config'
const API_KEY = 'visiondx_api_key'

/**
 * Save a scan result to localStorage
 */
export function saveResult(type, data) {
  const history = getHistory()
  const entry = {
    id: Date.now().toString(),
    type,
    timestamp: new Date().toISOString(),
    ...data,
  }
  history.unshift(entry)
  if (history.length > 200) history.splice(200)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  return entry
}

/**
 * Get all history from localStorage
 */
export function getHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * Get history by type
 */
export function getHistoryByType(type) {
  return getHistory().filter(entry => entry.type === type)
}

/**
 * Delete a specific entry
 */
export function deleteEntry(id) {
  const history = getHistory().filter(entry => entry.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

/**
 * Clear all history
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Get API key from localStorage or environment variables
 */
export function getApiKey() {
  return localStorage.getItem(API_KEY) || import.meta.env.VITE_GROQ_API_KEY || ''
}

/**
 * Set API key in localStorage
 */
export function setApiKey(key) {
  localStorage.setItem(API_KEY, key)
}

/**
 * Get WhatsApp Bot config
 */
export function getWhatsAppConfig() {
  try {
    const data = localStorage.getItem(WHATSAPP_KEY)
    const parsed = data ? JSON.parse(data) : {}
    return {
      doctorPhone: parsed.doctorPhone || '923001234567',
      phone: parsed.phone || '14155238886',
      joinCode: parsed.joinCode || 'join flag-none'
    }
  } catch {
    return {
      doctorPhone: '923001234567',
      phone: '14155238886',
      joinCode: 'join flag-none'
    }
  }
}

/**
 * Set WhatsApp Bot config
 */
export function setWhatsAppConfig(config) {
  const existing = getWhatsAppConfig()
  localStorage.setItem(WHATSAPP_KEY, JSON.stringify({ ...existing, ...config }))
}

/**
 * Format timestamp to readable string
 */
export function formatTime(isoString) {
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const SITE_LANG_KEY = 'visiondx_site_lang'

export function getSiteLanguage() {
  return localStorage.getItem(SITE_LANG_KEY) || 'en'
}

export function setSiteLanguage(lang) {
  localStorage.setItem(SITE_LANG_KEY, lang)
  window.dispatchEvent(new Event('siteLangChange'))
}
