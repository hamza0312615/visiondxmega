import { getApiKey } from './localStorage'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
 * Analyze image via FastAPI API Gateway proxy with direct browser fallback
 */
export async function analyzeImage(imageFile, prompt) {
  const base64Image = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'
  
  const groqKey = getApiKey()
  const geminiKey = localStorage.getItem('visiondx_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''

  // 1. Try FastAPI backend proxy first
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        mimeType: mimeType,
        prompt: prompt,
        groqKey: groqKey,
        geminiKey: geminiKey
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.content
    }
  } catch (err) {
    console.warn("Backend proxy failed or offline, executing direct client-side fallback:", err)
  }

  // 2. Direct client-side fallbacks (if backend is offline)
  // Attempt Groq Llama Vision directly
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.2-90b-vision-preview",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${base64Image}` }
                },
                {
                  type: "text",
                  text: prompt
                }
              ]
            }
          ],
          max_tokens: 2048,
          temperature: 0.2
        })
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices[0].message.content
      }
    } catch (e) {
      console.warn("Direct Groq Vision fallback failed:", e)
    }
  }

  // Attempt Gemini directly
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (res.ok) {
        const data = await res.json()
        return data.candidates[0].content.parts[0].text
      }
    } catch (e) {
      console.warn("Direct Gemini fallback failed:", e)
    }
  }

  throw new Error("Diagnostics API offline. Please verify that your API keys are configured correctly or start the backend python server.")
}

/**
 * Transcribe audio via FastAPI API Gateway proxy with direct browser fallback
 */
export async function transcribeAudio(audioBlob) {
  const groqKey = getApiKey()
  const mimeType = audioBlob.type || 'audio/webm'
  const extension = mimeType.includes('mp4') ? 'mp4' :
                    mimeType.includes('ogg') ? 'ogg' :
                    mimeType.includes('wav') ? 'wav' :
                    mimeType.includes('mpeg') ? 'mp3' : 'webm'

  const formData = new FormData()
  formData.append('file', audioBlob, `audio.${extension}`)
  if (groqKey) {
    formData.append('groqKey', groqKey)
  }

  // 1. Try FastAPI backend proxy first
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/transcribe-audio`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      const data = await response.json()
      return data.text || ''
    }
  } catch (err) {
    console.warn("Backend proxy failed, executing direct client-side fallback:", err)
  }

  // 2. Direct client-side fallbacks (if backend is offline)
  if (groqKey) {
    try {
      const directForm = new FormData()
      directForm.append('file', audioBlob, `audio.${extension}`)
      directForm.append('model', 'whisper-large-v3')
      directForm.append('response_format', 'json')
      
      const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`
        },
        body: directForm
      })
      if (res.ok) {
        const data = await res.json()
        return data.text || ''
      }
    } catch (e) {
      console.warn("Direct Whisper fallback failed:", e)
    }
  }

  throw new Error("Audio transcription API offline. Please verify your keys or start the backend python server.")
}

/**
 * Analyze text via FastAPI API Gateway proxy with direct browser fallback
 */
export async function analyzeText(prompt) {
  const groqKey = getApiKey()
  const geminiKey = localStorage.getItem('visiondx_gemini_key') || import.meta.env.VITE_GEMINI_API_KEY || ''

  // 1. Try FastAPI backend proxy first
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        groqKey: groqKey,
        geminiKey: geminiKey
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data.content
    }
  } catch (err) {
    console.warn("Backend proxy failed, executing direct client-side fallback:", err)
  }

  // 2. Direct client-side fallbacks (if backend is offline)
  if (groqKey) {
    try {
      const response_format = prompt.toLowerCase().includes("json format") ? { type: "json_object" } : null
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          response_format,
          max_tokens: 1536,
          temperature: 0.3
        })
      })
      if (res.ok) {
        const data = await res.json()
        return data.choices[0].message.content
      }
    } catch (e) {
      console.warn("Direct Llama completion fallback failed:", e)
    }
  }

  throw new Error("Text analysis API offline. Please verify your keys or start the backend python server.")
}
