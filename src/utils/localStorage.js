const STORAGE_KEY = 'visiondx_mega_history'
const WHATSAPP_KEY = 'visiondx_whatsapp_config'
const API_KEY = 'visiondx_api_key'

/**
 * Save a scan result to localStorage
 */
export function saveResult(type, data) {
  const history = getHistory()
  const entry = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
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
      phone: '15556734869',
      joinCode: ''
    }
  } catch {
    return {
      doctorPhone: '923001234567',
      phone: '15556734869',
      joinCode: ''
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
  
  // Set the googtrans cookie for Google Translate
  if (lang === 'ur') {
    document.cookie = "googtrans=/en/ur; path=/";
    document.cookie = "googtrans=/en/ur; path=/; domain=" + window.location.hostname;
    // Set for local development or subdomains
    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 2) {
      const domain = hostParts.slice(-2).join('.');
      document.cookie = "googtrans=/en/ur; path=/; domain=." + domain;
    }
  } else {
    document.cookie = "googtrans=/en/en; path=/";
    document.cookie = "googtrans=/en/en; path=/; domain=" + window.location.hostname;
    // Delete the cookie
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    
    // Explicitly delete wildcard subdomain cookies as well
    const hostParts = window.location.hostname.split('.');
    if (hostParts.length > 2) {
      const domain = hostParts.slice(-2).join('.');
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + domain;
      document.cookie = "googtrans=/en/en; path=/; domain=." + domain;
    }
  }
  
  window.dispatchEvent(new Event('siteLangChange'))
  // Reload the window so that Google Translate processes the cookie
  window.location.reload()
}

const IS_DEMO_KEY = 'visiondx_is_demo_mode'
const RISK_LOG_KEY = 'visiondx_riskLog'
const HEATMAP_DATA_KEY = 'visiondx_heatmapData'
const HEATMAP_OPT_IN_KEY = 'visiondx_heatmapOptIn'

export function isDemoMode() {
  return localStorage.getItem(IS_DEMO_KEY) === 'true'
}

export function setDemoMode(val) {
  localStorage.setItem(IS_DEMO_KEY, val ? 'true' : 'false')
}

export function getRiskLog() {
  try {
    const data = localStorage.getItem(RISK_LOG_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveRiskLog(urgency) {
  const log = getRiskLog()
  let score = 50 // Default for SEE_DOCTOR
  if (urgency === 'NORMAL') score = 20
  if (urgency === 'EMERGENCY') score = 85
  
  log.push({
    date: new Date().toISOString(),
    score,
    urgency
  })
  
  // Keep only last 100 entries
  if (log.length > 100) log.shift()
  localStorage.setItem(RISK_LOG_KEY, JSON.stringify(log))
}

export function getHeatmapOptIn() {
  return localStorage.getItem(HEATMAP_OPT_IN_KEY) === 'true'
}

export function setHeatmapOptIn(val) {
  localStorage.setItem(HEATMAP_OPT_IN_KEY, val ? 'true' : 'false')
}

export function getHeatmapData() {
  try {
    const data = localStorage.getItem(HEATMAP_DATA_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveHeatmapEntry(city, condition) {
  if (!getHeatmapOptIn()) return
  const data = getHeatmapData()
  data.push({
    city,
    condition,
    date: new Date().toISOString().split('T')[0]
  })
  localStorage.setItem(HEATMAP_DATA_KEY, JSON.stringify(data))
}

export function clearHeatmapData() {
  localStorage.removeItem(HEATMAP_DATA_KEY)
}

export function getDemoData(moduleType) {
  const sampleBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  const silentWavBase64 = "UklGRigAAABXQVZFZm10IBIAAAABAAERK28AAEsBAAEGABIAZGF0YQAAAAA="

  switch(moduleType) {
    case 'eye':
      return {
        base64: sampleBase64,
        symptoms: "Redness in the left eye, mild itching, started 24 hours ago. Teary discharge present. Strongly suggests Conjunctivitis."
      }
    case 'skin':
      return {
        base64: sampleBase64,
        location: "Back of Left Shoulder",
        itching: "Moderate",
        symptoms: "Irregular dry red patch on back, itchy, slightly raised. Grounded check basalioma/psoriasis risk."
      }
    case 'wound':
      return {
        base64: sampleBase64,
        symptoms: "Post-op abdominal incision, 5 days, showing mild redness but no swelling or discharge. Healing tracker scan."
      }
    case 'medicine':
      return {
        base64: sampleBase64,
        symptoms: "White round tablet marked with an X, found in an unlabelled blister pack. Explaining active ingredients."
      }
    case 'hair':
      return {
        base64: sampleBase64,
        location: "Scalp Vertex / Crown",
        symptoms: "Premature white hair thinning on crown, dandruff scaling. Grounded alopecia risk."
      }
    case 'cough':
      return {
        base64: silentWavBase64,
        fileName: "demo_cough_acoustics.wav"
      }
    case 'sleep':
      return {
        hours: "5",
        quality: "Poor",
        snoring: "Yes - Heavy",
        awakenings: "3",
        fatigue: "Severe",
        apneaSymptoms: "Gasping for air / snort awake"
      }
    case 'routine':
      return {
        sleep: "5",
        water: "3",
        screenTime: "9",
        stress: "High",
        activity: "Sedentary"
      }
    default:
      return null
  }
}

