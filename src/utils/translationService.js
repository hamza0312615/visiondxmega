/**
 * Translation service using MyMemory Translation API and LibreTranslate (Argos) fallback.
 */

const LANG_MAPPING = {
  'ur-PK': 'ur',
  'hi-IN': 'hi',
  'pa-IN': 'pa',
  'ar-SA': 'ar',
  'bn-BD': 'bn',
  'ur': 'ur',
  'hi': 'hi',
  'pa': 'pa',
  'ar': 'ar',
  'bn': 'bn',
  'en-US': 'en',
  'en': 'en'
};

/**
 * Translates the given text from sourceLangCode to targetLangCode.
 * Uses MyMemory API as the primary translator and LibreTranslate (Argos) as a fallback.
 * 
 * @param {string} text The text to translate
 * @param {string} targetLangCode Locale code for the target language (e.g. 'ur-PK')
 * @param {string} sourceLangCode Locale code for the source language (default 'en')
 * @returns {Promise<string|null>} The translated text, or null if all calls fail.
 */
export async function translateText(text, targetLangCode, sourceLangCode = 'en') {
  if (!text || !text.trim()) return '';

  const target = LANG_MAPPING[targetLangCode] || targetLangCode;
  const source = LANG_MAPPING[sourceLangCode] || sourceLangCode;

  if (target === source) {
    return text;
  }

  // 1. Primary: MyMemory API
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}&de=you@email.com`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MyMemory returned HTTP status ${res.status}`);
    }
    const data = await res.json();
    if (data?.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (error) {
    console.warn('MyMemory translation failed, attempting LibreTranslate fallback:', error);
  }

  // 2. Secondary Fallback: LibreTranslate / ArgosTranslate
  try {
    const res = await fetch('https://translate.argosopentech.com/translate', {
      method: 'POST',
      body: JSON.stringify({
        q: text,
        source: source,
        target: target,
        api_key: ''
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.translatedText) {
        return data.translatedText;
      }
    }
  } catch (error) {
    console.warn('LibreTranslate fallback failed:', error);
  }

  return null;
}
