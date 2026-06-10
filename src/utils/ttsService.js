/**
 * VisionDX Mega — Unified Text-to-Speech (TTS) Service
 *
 * Priority chain (best quality first):
 *   1. Microsoft Edge Neural TTS (via local backend proxy)
 *      → FREE, no API key, no Google Console
 *      → Supports: ur-PK-UzmaNeural, ps-AF-LatifaNeural, sd-PK-SanaNeural,
 *                  hi-IN-SwaraNeural, ar-SA-ZariyahNeural, pa-IN-VaaniNeural,
 *                  bn-IN-TanishaaNeural, en-US-JennyNeural
 *   2. ElevenLabs API (eleven_multilingual_v2 — premium English/other)
 *   3. Browser native speechSynthesis (absolute last resort)
 */

import { getApiKey } from './localStorage'
import { generateEdgeTTSInBrowser } from './edgeTtsBrowser'

// ElevenLabs Rachel Multilingual voice
const ELEVENLABS_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

let currentAudio = null
let currentUtterance = null

/**
 * Map from app-level lang codes → backend lang codes for Edge TTS
 * The backend normalises these and picks the right neural voice automatically.
 */
const LANG_TO_EDGE_CODE = {
  'ur-PK':    'ur',
  'ur':       'ur',
  'ur-roman': 'ur-roman',   // Backend maps → hi-IN-SwaraNeural (best for Roman Urdu)
  'hi-IN':    'hi',
  'hi':       'hi',
  'ar-SA':    'ar',
  'ar-XA':    'ar',
  'ar':       'ar',
  'bn-IN':    'bn',
  'bn-BD':    'bn',
  'bn':       'bn',
  'pa-IN':    'pa',
  'pa':       'pa',
  'ps-AF':    'ps',          // Pashto — ONLY available via Edge TTS
  'ps':       'ps',
  'sd-PK':    'sd',          // Sindhi — ONLY available via Edge TTS
  'sd':       'sd',
  'en-US':    'en',
  'en-GB':    'en-gb',
  'en':       'en',
}

const EDGE_VOICES = {
  'ur':    'ur-PK-UzmaNeural',
  'ur-roman': 'hi-IN-SwaraNeural',
  'hi':    'hi-IN-SwaraNeural',
  'ar':    'ar-SA-ZariyahNeural',
  'bn':    'bn-IN-TanishaaNeural',
  'pa':    'pa-IN-VaaniNeural',
  'ps':    'ps-AF-LatifaNeural',
  'sd':    'sd-PK-SanaNeural',
  'en':    'en-US-JennyNeural',
  'en-gb': 'en-GB-SoniaNeural',
}

const LANG_TO_GOOGLE_CODE = {
  'ur-PK':    'ur',
  'ur':       'ur',
  'ur-roman': 'hi',       // Use Hindi pronunciation for Roman Urdu phonetics
  'hi-IN':    'hi',
  'hi':       'hi',
  'ar-SA':    'ar',
  'ar-XA':    'ar',
  'ar':       'ar',
  'bn-IN':    'bn',
  'bn-BD':    'bn',
  'bn':       'bn',
  'pa-IN':    'pa',
  'pa':       'pa',
  'ps-AF':    'ps',
  'ps':       'ps',
  'sd-PK':    'sd',
  'sd':       'sd',
  'en-US':    'en',
  'en-GB':    'en',
  'en':       'en',
}

/** Stop all active speech immediately */
export function cancelSpeech() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  currentUtterance = null
}

/**
 * Speaks the given text aloud.
 * @param {string} text        The text to speak
 * @param {string} langCode    BCP-47 code (e.g. 'ur-PK', 'hi-IN', 'ps-AF')
 * @param {object} options     { onStart, onEnd, onError }
 */
export async function speakText(text, langCode = 'en-US', options = {}) {
  const { onStart, onEnd, onError } = options

  if (!text || !text.trim()) {
    if (onEnd) onEnd()
    return
  }

  // Sanitize: strip markdown asterisks, dashes, and emojis
  const cleanText = text
    .replace(/\*\*/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[-•]\s*/gm, '')
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
    .replace(/[\n\r]+/g, ', ') // replace newlines with comma for natural pause
    .replace(/\s{2,}/g, ' ')   // Remove extra spaces
    .replace(/[_~#`]/g, '')     // Extra markdown cleanup
    .trim()

  cancelSpeech()

  const edgeEnabled = import.meta.env.VITE_EDGE_TTS_ENABLED !== 'false'
  const edgeLang = LANG_TO_EDGE_CODE[langCode] || LANG_TO_EDGE_CODE[langCode.split('-')[0]] || 'en'

  // ── 1. Microsoft Edge Neural TTS (Primary — FREE, best quality for South Asian langs) ──
  if (edgeEnabled) {
    try {
      const voiceName = EDGE_VOICES[edgeLang] || EDGE_VOICES['en'];
      
      console.log(`[Edge Neural TTS Browser] Requesting voice="${voiceName}"`);
      const audioBlob = await generateEdgeTTSInBrowser(cleanText, voiceName);
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl)
      currentAudio = audio

      audio.onplay = () => {
        if (onStart) onStart()
        console.log(`✅ [Edge Neural TTS] ${edgeLang} → playing "${cleanText.substring(0, 50)}..."`)
      }
      audio.onended = () => {
        if (onEnd) onEnd()
        currentAudio = null
        URL.revokeObjectURL(audioUrl)
      }
      audio.onerror = (e) => {
        console.error('[Edge TTS] Playback error:', e)
        if (onError) onError(e)
        currentAudio = null
      }

      await audio.play()
      return
    } catch (err) {
      console.warn('[Edge TTS Browser] Failed (websocket blocked or timeout), trying Google Translate HTTPS TTS:', err.message)
    }
  }

  // ── 2. Google Translate HTTPS TTS (Secondary Fallback — FREE, HTTPS, no backend needed) ──
  try {
    const googleLang = LANG_TO_GOOGLE_CODE[langCode] || LANG_TO_GOOGLE_CODE[langCode.split('-')[0]] || 'en'
    console.log(`[Google HTTPS TTS] Trying fallback for lang="${googleLang}"`)
    
    // Chunking text if it exceeds 200 characters for Google TTS
    const sentences = cleanText.match(/[^.!?，。]+[.!?，。]*/g) || [cleanText]
    const chunks = []
    let currentChunk = ""
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length < 180) {
        currentChunk += sentence
      } else {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = sentence
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim())
    
    if (chunks.length > 0) {
      // Play chunks sequentially
      await new Promise((resolve, reject) => {
        let chunkIndex = 0
        
        const playNextChunk = () => {
          if (chunkIndex >= chunks.length) {
            if (onEnd) onEnd()
            resolve()
            return
          }
          
          const chunkText = chunks[chunkIndex]
          const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${googleLang}&client=tw-ob&q=${encodeURIComponent(chunkText)}`
          
          const audio = new Audio(url)
          currentAudio = audio
          
          audio.onplay = () => {
            if (chunkIndex === 0 && onStart) onStart()
          }
          audio.onended = () => {
            chunkIndex++
            playNextChunk()
          }
          audio.onerror = (e) => {
            console.error('[Google TTS] Playback error on chunk:', e)
            if (chunkIndex === 0) {
              reject(new Error('Google TTS failed'))
            } else {
              if (onEnd) onEnd()
              resolve()
            }
          }
          
          audio.play().catch(err => {
            if (chunkIndex === 0) {
              reject(err)
            } else {
              if (onError) onError(err)
              resolve()
            }
          })
        }
        
        playNextChunk()
      })
      return // Success
    }
  } catch (googleErr) {
    console.warn('[Google HTTPS TTS] Failed, trying ElevenLabs:', googleErr.message)
  }

  // ── 3. ElevenLabs API (Tertiary — premium multilingual) ──────────────────
  const elevenKey = import.meta.env.VITE_ELEVENLABS_API_KEY
    || localStorage.getItem('visiondx_elevenlabs_key')
    || ''

  if (elevenKey) {
    try {
      console.log(`[ElevenLabs] Requesting TTS for "${cleanText.substring(0, 40)}..."`)

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': elevenKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      )

      if (!response.ok) throw new Error(`ElevenLabs API status ${response.status}`)

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudio = audio

      audio.onplay = () => {
        if (onStart) onStart()
        console.log(`✅ [ElevenLabs] Playing: "${cleanText.substring(0, 40)}..."`)
      }
      audio.onended = () => { if (onEnd) onEnd(); currentAudio = null }
      audio.onerror = (e) => { if (onError) onError(e); currentAudio = null }

      await audio.play()
      return
    } catch (err) {
      console.warn('[ElevenLabs] Failed, falling back to browser native:', err.message)
    }
  }

  // ── 3. Browser native speechSynthesis (Last resort) ───────────────────────
  fallbackToNativeTTS(cleanText, langCode, onStart, onEnd, onError)
}

function fallbackToNativeTTS(cleanText, langCode, onStart, onEnd, onError) {
  console.log('[Native TTS] Using browser speechSynthesis as last resort')

  if (!('speechSynthesis' in window)) {
    console.warn('[Native TTS] speechSynthesis not supported in this browser.')
    if (onError) onError(new Error('TTS not supported'))
    return
  }

  const targetLangCode = langCode === 'ur-roman' ? 'en-US' : langCode
  const utterance = new SpeechSynthesisUtterance(cleanText)

  utterance.lang = targetLangCode
  utterance.rate = langCode === 'ur-roman' ? 0.88 : 0.95

  const voices = window.speechSynthesis.getVoices()
  const langPrefix = targetLangCode.split('-')[0].toLowerCase()

  let bestVoice = voices.find(v => v.lang.toLowerCase() === targetLangCode.toLowerCase())
    || voices.find(v => v.lang.toLowerCase().startsWith(langPrefix))

  // Special overrides for better voice selection on Windows/Mac
  if (langCode === 'hi-IN') {
    bestVoice = voices.find(v => v.name.includes('Swara') || v.name.includes('Hindi') || v.lang.includes('hi'))
      || bestVoice
  } else if (langCode === 'ar-SA' || langCode === 'ar-XA') {
    bestVoice = voices.find(v => v.name.includes('Arabic') || v.lang.includes('ar'))
      || bestVoice
  }

  if (bestVoice) utterance.voice = bestVoice

  utterance.onstart = () => { if (onStart) onStart() }
  utterance.onend = () => { if (onEnd) onEnd(); currentUtterance = null }
  utterance.onerror = (e) => { if (onError) onError(e); currentUtterance = null }

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}
