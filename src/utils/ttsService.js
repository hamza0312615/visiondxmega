/**
 * Unified Text-to-Speech (TTS) Service using ElevenLabs API with browser fallback.
 */

import { getApiKey } from './localStorage.js'

// Rachel Multilingual Voice ID on ElevenLabs. High-quality and supports Urdu, Hindi, Arabic, Bengali, Punjabi, Spanish, French, etc.
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM' 

let currentAudio = null
let currentUtterance = null

/**
 * Halts any active speech immediately (both ElevenLabs audio and native speech synthesis)
 */
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
 * Attempts ElevenLabs API first if the VITE_ELEVENLABS_API_KEY is defined.
 * Falls back to browser native speechSynthesis if not available or on error.
 * 
 * @param {string} text The text script to read
 * @param {string} langCode Target language code (e.g. 'ur-PK', 'en-US', 'hi-IN')
 * @param {object} options Callbacks: { onStart, onEnd, onError }
 */
export async function speakText(text, langCode = 'en-US', options = {}) {
  const { onStart, onEnd, onError } = options
  
  if (!text || !text.trim()) {
    if (onEnd) onEnd()
    return
  }

  // Sanitize the text (remove markdown asterisks and dashes)
  const cleanText = text.replace(/\*\*/g, '').replace(/[-*]/g, '').trim()

  // Always cancel any active speech first
  cancelSpeech()

  // Get ElevenLabs API Key from environment or localStorage
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || localStorage.getItem('visiondx_elevenlabs_key') || ''

  if (apiKey) {
    try {
      console.log(`ElevenLabs TTS requested for: "${cleanText.substring(0, 40)}..." (Lang: ${langCode})`)
      
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${DEFAULT_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
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
      })

      if (!response.ok) {
        throw new Error(`ElevenLabs API returned status code ${response.status}`)
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      currentAudio = audio

      audio.onplay = () => {
        if (onStart) onStart()
      }
      audio.onended = () => {
        if (onEnd) onEnd()
        currentAudio = null
      }
      audio.onerror = (e) => {
        console.error('Audio playback error:', e)
        if (onError) onError(e)
        currentAudio = null
      }

      await audio.play()
      return
    } catch (err) {
      console.warn('ElevenLabs TTS failed, rolling back to native speechSynthesis:', err)
    }
  }

  // Fallback to Google Translate TTS via Backend Proxy
  let targetLangCode = langCode.split('-')[0].toLowerCase() // 'ur', 'en', 'ar', 'hi', etc.
  if (langCode === 'ur-roman') {
    targetLangCode = 'hi' // Google TTS Hindi voice is excellent at reading Roman Urdu/Hindustani
  }
  const backendUrl = import.meta.env.VITE_WA_BACKEND_URL || 'http://localhost:3001'
  console.log(`Using Google TTS Proxy Fallback for: ${cleanText.substring(0, 40)}...`)

  // Google TTS has a ~200 char limit. We need to chunk the text.
  const chunks = []
  let currentChunk = ''
  const sentences = cleanText.split(/([.!?،۔\n]+)/) 
  
  for (let i = 0; i < sentences.length; i++) {
    const part = sentences[i]
    if ((currentChunk.length + part.length) <= 190) {
      currentChunk += part
    } else {
      if (currentChunk.trim()) chunks.push(currentChunk.trim())
      if (part.length > 190) {
        let remaining = part
        while (remaining.length > 190) {
          chunks.push(remaining.substring(0, 190))
          remaining = remaining.substring(190)
        }
        currentChunk = remaining
      } else {
        currentChunk = part
      }
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim())

  if (chunks.length === 0) {
    if (onEnd) onEnd()
    return
  }

  let chunkIndex = 0

  const playNextChunk = async () => {
    if (chunkIndex >= chunks.length) {
      if (onEnd) onEnd()
      return
    }

    const chunk = chunks[chunkIndex]
    const url = `${backendUrl}/api/tts?lang=${targetLangCode}&text=${encodeURIComponent(chunk)}`
    
    try {
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
        console.error('Google TTS audio proxy error:', e)
        fallbackToNativeTTS(cleanText, langCode, onStart, onEnd, onError)
      }

      await audio.play()
    } catch (err) {
      console.warn('Google TTS proxy failed to play:', err)
      fallbackToNativeTTS(cleanText, langCode, onStart, onEnd, onError)
    }
  }

  playNextChunk()
}

// Last resort: Native browser TTS
function fallbackToNativeTTS(cleanText, langCode, onStart, onEnd, onError) {
  console.log('Using native speechSynthesis as last resort fallback.')
  if ('speechSynthesis' in window) {
    const targetLangCode = langCode === 'ur-roman' ? 'en-US' : langCode
    const utterance = new SpeechSynthesisUtterance(cleanText)
    
    utterance.lang = targetLangCode
    utterance.rate = langCode === 'ur-roman' ? 0.88 : 0.95 

    const voices = window.speechSynthesis.getVoices()
    let bestVoice = voices.find(v => v.lang.toLowerCase() === targetLangCode.toLowerCase()) ||
                     voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.split('-')[0].toLowerCase()))

    if (langCode === 'ur-PK') {
      bestVoice = voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu')) || bestVoice
    } else if (langCode === 'hi-IN') {
      bestVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('Google ID')) || bestVoice
    } else if (langCode === 'ar-SA') {
      bestVoice = voices.find(v => v.lang.includes('ar') || v.name.includes('Arabic')) || bestVoice
    }

    if (bestVoice) {
      utterance.voice = bestVoice
    }

    utterance.onstart = () => {
      if (onStart) onStart()
    }
    utterance.onend = () => {
      if (onEnd) onEnd()
      currentUtterance = null
    }
    utterance.onerror = (e) => {
      if (onError) onError(e)
      currentUtterance = null
    }

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  } else {
    console.warn('Browser does not support native speechSynthesis.')
    if (onError) onError(new Error('TTS not supported at all'))
  }
}

