import { useState, useRef, useEffect, useCallback } from 'react'

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  const speakText = useCallback((text, lang) => {
    if (!synthRef.current) return
    synthRef.current.cancel()

    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)

    let langCode = 'en-US'
    if (lang.includes('Roman')) langCode = 'ur-roman'
    else if (lang.includes('Urdu')) {
      const voices = synthRef.current.getVoices()
      const hasUrduVoice = !!voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu'))
      langCode = hasUrduVoice ? 'ur-PK' : 'ur-roman'
    }
    else if (lang.includes('Hindi')) langCode = 'hi-IN'
    else if (lang.includes('Punjabi')) langCode = 'pa-IN'
    else if (lang.includes('Pashto')) langCode = 'ps-AF'
    else if (lang.includes('Sindhi')) langCode = 'sd-PK'
    else if (lang.includes('Arabic')) langCode = 'ar-SA'
    else if (lang.includes('Bengali')) langCode = 'bn-BD'

    // If we are speaking Roman Urdu, we use standard English voice
    const targetLangCode = langCode === 'ur-roman' ? 'en-US' : langCode
    utterance.lang = targetLangCode
    utterance.rate = langCode === 'ur-roman' ? 0.88 : 0.9 // slightly slower for Roman Urdu to sound natural

    const voices = synthRef.current.getVoices()
    let bestVoice = voices.find(v => v.lang.toLowerCase() === targetLangCode.toLowerCase()) ||
                     voices.find(v => v.lang.toLowerCase().startsWith(targetLangCode.split('-')[0].toLowerCase()))

    if (langCode === 'ur-PK') {
      bestVoice = voices.find(v => v.lang.includes('ur') || v.name.includes('Urdu')) || bestVoice
    } else if (langCode === 'ur-roman') {
      bestVoice = voices.find(v => v.lang.startsWith('en')) || bestVoice
    } else if (langCode === 'hi-IN') {
      bestVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi') || v.name.includes('Google ID')) || bestVoice
    } else if (langCode === 'ar-SA') {
      bestVoice = voices.find(v => v.lang.includes('ar') || v.name.includes('Arabic')) || bestVoice
    }

    if (bestVoice) {
      utterance.voice = bestVoice
    }

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setSpeaking(false)
    }
  }, [])

  const toggleSpeech = useCallback((text, lang) => {
    if (!synthRef.current) return
    if (speaking) {
      synthRef.current.cancel()
      setSpeaking(false)
    } else if (text) {
      speakText(text, lang)
    }
  }, [speaking, speakText])

  return {
    speaking,
    speakText,
    stopSpeaking,
    toggleSpeech
  }
}
