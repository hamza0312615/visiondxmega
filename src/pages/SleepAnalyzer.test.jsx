import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SleepAnalyzer from './SleepAnalyzer'
import * as groqApi from '../utils/groqApi'
import * as localStorage from '../utils/localStorage'

// Mock dependencies
vi.mock('../utils/groqApi', () => ({
  analyzeText: vi.fn(),
  transcribeAudio: vi.fn()
}))

vi.mock('../utils/localStorage', () => ({
  saveResult: vi.fn(),
  getHistoryByType: vi.fn(() => []),
  formatTime: vi.fn(),
  isDemoMode: vi.fn(() => false),
  setDemoMode: vi.fn(),
  getDemoData: vi.fn()
}))

describe('SleepAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles error in handleAudioAnalyze catch block correctly', async () => {
    // 1. Mock transcribeAudio to throw an error
    const errorMessage = 'API rate limit exceeded'
    groqApi.transcribeAudio.mockRejectedValue(new Error(errorMessage))

    // 2. Render component
    render(<SleepAnalyzer />)

    // 3. Switch to Audio tab - check the actual text from the DOM output
    const audioTabButton = screen.getByText(/🎙️ Upload Sleep Audio/i)
    fireEvent.click(audioTabButton)

    // 4. Mock file selection to bypass the early return
    const fileInput = document.querySelector('input[type="file"]')
    const file = new File(['dummy content'], 'test.wav', { type: 'audio/wav' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // 5. Submit form
    const analyzeButton = screen.getByText(/Analyze Sleep Audio with Whisper AI/i)
    fireEvent.click(analyzeButton)

    // 6. Assert error state is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})
