/**
 * VisionDX Mega — Translation Service
 *
 * Priority:
 *   1. MyMemory API (free, 10k words/day, decent quality)
 *   2. LibreTranslate / ArgosTranslate (open-source fallback)
 *
 * Supports: ur, hi, ar, bn, pa, ps (Pashto), sd (Sindhi), en
 */

// Full language code → ISO 639-1 short code mapping
const LANG_MAPPING = {
  'ur-PK':    'ur',
  'ur':       'ur',
  'ur-roman': 'en',   // Roman Urdu is written in English letters — don't translate
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

/**
 * Translate text from sourceLang to targetLang.
 * @param {string} text             Text to translate
 * @param {string} targetLangCode   Target language code (e.g. 'ur-PK', 'ps-AF')
 * @param {string} sourceLangCode   Source language code (default 'en')
 * @returns {Promise<string|null>}  Translated text, or null if all fail
 */
export async function translateText(text, targetLangCode, sourceLangCode = 'en') {
  if (!text || !text.trim()) return ''

  const target = LANG_MAPPING[targetLangCode] || targetLangCode.split('-')[0]
  const source = LANG_MAPPING[sourceLangCode] || sourceLangCode.split('-')[0]

  // No translation needed
  if (target === source || (target === 'en' && source === 'en')) {
    return text
  }

  // Roman Urdu — AI generates it directly, no translation needed here
  if (targetLangCode === 'ur-roman') {
    return text
  }

  const googleKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;

  // ── 1. Google Cloud Translation API (Primary, Premium) ───────────────────
  if (googleKey) {
    try {
      const url = `https://translation.googleapis.com/language/translate/v2?key=${googleKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' })
      });
      if (res.ok) {
        const data = await res.json();
        const translated = data?.data?.translations?.[0]?.translatedText;
        if (translated) {
          console.log(`✅ [Google Translate] ${source} → ${target}: "${translated.substring(0, 60)}..."`);
          return translated;
        }
      }
    } catch (err) {
      console.warn('[Google Translate] Translation failed, falling back:', err.message);
    }
  }

  // ── 2. MyMemory API (Secondary, free, 10k words/day) ───────────────────
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      const translated = data?.responseData?.translatedText
      if (translated && data?.responseStatus === 200) {
        console.log(`✅ [MyMemory] ${source} → ${target}: "${translated.substring(0, 60)}..."`)
        return translated
      }
    }
  } catch (err) {
    console.warn('[MyMemory] Translation failed:', err.message)
  }

  // ── 3. LibreTranslate / ArgosTranslate (Tertiary Fallback) ───────────────
  try {
    const res = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source, target, api_key: '' })
    })
    if (res.ok) {
      const data = await res.json()
      const translated = data?.translatedText
      if (translated) {
        console.log(`✅ [LibreTranslate] ${source} → ${target}`)
        return translated
      }
    }
  } catch (err) {
    console.warn('[LibreTranslate] Translation failed:', err.message)
  }

  console.warn(`[Translation] All services failed for ${source} → ${target}. Returning original.`)
  return null
}
