import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fileToBase64, analyzeImage, transcribeAudio, analyzeText } from './groqApi.js'

// Mock FileReader
const mockReadAsDataURL = vi.fn()
global.FileReader = class {
  constructor() {
    this.result = null
    this.onload = null
    this.onerror = null
  }
  readAsDataURL(file) {
    mockReadAsDataURL(file)
    if (file && file.fail) {
      setTimeout(() => { if (this.onerror) this.onerror(new Error('Read failed')) }, 0)
    } else {
      this.result = `data:${file.type || 'image/jpeg'};base64,${file.base64}`
      setTimeout(() => { if (this.onload) this.onload() }, 0)
    }
  }
}

// Mock localStorage via vi.stubGlobal
const mockLocalStorageStore = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key) => mockLocalStorageStore[key] || null),
  setItem: vi.fn((key, value) => { mockLocalStorageStore[key] = String(value) }),
  removeItem: vi.fn((key) => { delete mockLocalStorageStore[key] })
})

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

describe('groqApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const key in mockLocalStorageStore) delete mockLocalStorageStore[key]
    import.meta.env.VITE_GROQ_API_KEY = ''
    import.meta.env.VITE_GEMINI_API_KEY = ''
  })

  describe('fileToBase64', () => {
    it('should correctly extract base64 part', async () => {
      const dummyFile = { base64: 'abc', type: 'image/jpeg' }
      const result = await fileToBase64(dummyFile)
      expect(result).toBe('abc')
    })

    it('should handle reader.onerror', async () => {
      await expect(fileToBase64({ fail: true })).rejects.toThrow('Read failed')
    })
  })

  describe('analyzeImage', () => {
    const dummyFile = { base64: 'abc', type: 'image/jpeg' }

    it('should throw if no API key is found', async () => {
      await expect(analyzeImage(dummyFile, 'prompt')).rejects.toThrow('No API key found. Please set your Groq API key in Settings.')
    })

    it('should return primary API response (Groq Vision) on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Primary API Success' } }] })
      })

      const result = await analyzeImage(dummyFile, 'prompt', 'dummy_key')
      expect(result).toBe('Primary API Success')
    })

    it('should fallback to Gemini SDK on Groq failure', async () => {
      // Groq Vision failure
      global.fetch.mockResolvedValueOnce({ ok: false })

      mockLocalStorageStore['visiondx_gemini_key'] = 'gemini_key'

      // Mock Gemini SDK internal fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini SDK Success' }] } }] })
      })

      const result = await analyzeImage(dummyFile, 'prompt', 'dummy_key')
      expect(result).toBe('Gemini SDK Success')
    })

    it('should fallback to Gemini REST when SDK fails', async () => {
      // Groq Vision failure
      global.fetch.mockResolvedValueOnce({ ok: false })
      mockLocalStorageStore['visiondx_gemini_key'] = 'gemini_key'

      // SDK failure
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 })

      // REST success
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'Gemini REST Success' }] } }] })
      })

      const result = await analyzeImage(dummyFile, 'prompt', 'dummy_key')
      expect(result).toBe('Gemini REST Success')
    })

    it('should fallback to OCR when both Groq Vision and Gemini fail', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false }) // Groq Vision
      mockLocalStorageStore['visiondx_gemini_key'] = 'gemini_key'
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 }) // SDK
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 }) // REST

      // OCR fallback calls analyzeText which makes another Groq call
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OCR Fallback Success' } }] })
      })

      const result = await analyzeImage(dummyFile, 'prompt', 'dummy_key')
      expect(result).toBe('OCR Fallback Success')
    })

    it('should throw on complete failure', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false }) // Groq Vision
      mockLocalStorageStore['visiondx_gemini_key'] = 'gemini_key'
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 }) // SDK
      global.fetch.mockResolvedValueOnce({ ok: false, status: 500 }) // REST
      global.fetch.mockResolvedValueOnce({ ok: false }) // OCR

      // Silencing console warnings/errors for clean test output
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const err = vi.spyOn(console, 'error').mockImplementation(() => {})

      await expect(analyzeImage(dummyFile, 'prompt', 'dummy_key')).rejects.toThrow('Image analysis failed across all AI models (Groq Vision, Gemini, and OCR Fallback). Please check your API keys or internet connection.')

      warn.mockRestore()
      err.mockRestore()
    })
  })

  describe('transcribeAudio', () => {
    it('should return transcribed text on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: 'Transcribed text' })
      })
      const result = await transcribeAudio(new Blob(['dummy']), 'dummy_key')
      expect(result).toBe('Transcribed text')
    })

    it('should throw error on failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'Bad request audio' } })
      })
      await expect(transcribeAudio(new Blob(['dummy']), 'dummy_key')).rejects.toThrow('Bad request audio')
    })
  })

  describe('analyzeText', () => {
    it('should return analyzed text on success', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Analyzed text' } }] })
      })
      const result = await analyzeText('prompt', 'dummy_key')
      expect(result).toBe('Analyzed text')
    })

    it('should throw error on failure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Unauthorized text' } })
      })
      await expect(analyzeText('prompt', 'dummy_key')).rejects.toThrow('Unauthorized text')
    })
  })
})
