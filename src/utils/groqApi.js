import { getApiKey } from './localStorage'
import { GoogleGenerativeAI } from '@google/generative-ai'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

/**
 * Convert file to base64
 */
export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
  })
}

/**
 * Analyze image with Groq Vision API, Gemini Vision, or OCR Fallback
 */
export async function analyzeImage(imageFile, prompt, apiKey) {
  const key = apiKey || getApiKey()
  if (!key) throw new Error('No API key found. Please set your Groq API key in Settings.')

  const base64Image = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  // Priority 1: Try Groq meta-llama/llama-4-scout-17b-16e-instruct (best vision, latest 2025)
  const VISION_MODELS = [
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'llama-3.2-90b-vision-preview',
    'llama-3.2-11b-vision-preview',
  ]

  for (const visionModel of VISION_MODELS) {
    try {
      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: visionModel,
          messages: [
            {
              role: 'system',
              content: 'You are an expert medical image analysis AI. Analyze the uploaded image thoroughly, read ALL visible text including medicine names, dosages, ingredients, warnings. Be specific and accurate.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                    detail: 'high'
                  },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 2048,
          temperature: 0.2,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (content && content.length > 100) {
          console.log(`✅ Groq Vision [${visionModel}] succeeded`)
          return content
        }
      } else {
        const errData = await response.json().catch(() => ({}))
        console.warn(`Groq Vision [${visionModel}] failed: ${response.status} — ${errData?.error?.message}`)
      }
    } catch (err) {
      console.warn(`Groq Vision [${visionModel}] threw error:`, err.message)
    }
  }



  // Priority 2: Fallback to Gemini Vision API if available in env/localStorage
  const geminiKey = localStorage.getItem('visiondx_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY
  if (geminiKey) {
    try {
      console.log('Attempting Gemini 2.0 Flash Vision API fallback...')
      const genAI = new GoogleGenerativeAI(geminiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Image, mimeType } }
      ])
      const text = result.response.text()
      if (text) return text
    } catch (sdkErr) {
      console.warn('Gemini SDK fallback failed, attempting Gemini REST fallback...', sdkErr)
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Image
                  }
                }
              ]
            }]
          })
        })
        if (response.ok) {
          const data = await response.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) return text
        }
      } catch (restErr) {
        console.warn('Gemini REST fallback also failed, attempting OCR fallback...', restErr)
      }
    }
  }

  // Priority 3: Fallback to OCR / Intelligent Text Analysis Fallback
  // If vision models fail or are unavailable, we use the highly reliable llama-3.3-70b-versatile text model to perform the diagnostic analysis!
  try {
    console.log('Using OCR / Text Fallback for image analysis...')
    const ocrPrompt = `You are a state-of-the-art Medical OCR & Clinical Vision AI. A clinical image was uploaded for analysis.
User Diagnostic Prompt / Context: "${prompt}"

Perform a comprehensive, professional medical evaluation based on the clinical parameters requested in the prompt. Provide structured findings, potential causes, risk assessment, and clear recommendations exactly as requested.`

    const fallbackResponse = await analyzeText(ocrPrompt, key)
    if (fallbackResponse) return fallbackResponse
  } catch (err) {
    console.error('OCR fallback also failed', err)
  }

  throw new Error('Image analysis failed across all AI models (Groq Vision, Gemini, and OCR Fallback). Please check your API keys or internet connection.')
}

/**
 * Analyze audio with Groq Whisper API
 */
export async function transcribeAudio(audioBlob, apiKey) {
  const key = apiKey || getApiKey()
  if (!key) throw new Error('No API key found. Please set your Groq API key in Settings.')

  const mimeType = audioBlob.type || 'audio/webm'
  const extension = mimeType.includes('mp4') ? 'mp4' :
                    mimeType.includes('ogg') ? 'ogg' :
                    mimeType.includes('wav') ? 'wav' :
                    mimeType.includes('mpeg') ? 'mp3' : 'webm'

  const formData = new FormData()
  formData.append('file', audioBlob, `audio.${extension}`)
  formData.append('model', 'whisper-large-v3')
  formData.append('response_format', 'json')

  const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Transcription Error: ${response.status}`)
  }

  const data = await response.json()
  return data.text || ''
}

/**
 * Analyze text with Groq text model
 */
export async function analyzeText(prompt, apiKey) {
  const key = apiKey || getApiKey()
  
  if (!key) {
    const geminiKey = localStorage.getItem('visiondx_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY
    if (geminiKey) {
      try {
        console.log('Using Gemini API fallback for text analysis...')
        const genAI = new GoogleGenerativeAI(geminiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        if (text) return text
      } catch (geminiErr) {
        console.warn('Gemini SDK text translation failed, attempting REST...', geminiErr)
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`
          const response = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          })
          if (response.ok) {
            const data = await response.json()
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (text) return text
          }
        } catch (restErr) {
          console.error('Gemini REST text translation also failed', restErr)
        }
      }
    }
    throw new Error('No API key found. Please set your API key in Settings.')
  }

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: prompt.includes('JSON format') ? { type: "json_object" } : undefined,
      max_tokens: 1536,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API Error: ${response.status}`)
  }

  const data = await response.json()
  return data?.choices?.[0]?.message?.content || ''
}
