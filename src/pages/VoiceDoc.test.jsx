import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import VoiceDoc from './VoiceDoc'

// Mock local storage to prevent errors during render
beforeEach(() => {
  Storage.prototype.getItem = vi.fn((key) => {
    if (key === 'visiondx_user') {
      return JSON.stringify({ name: 'TestUser', age: '30', gender: 'Female', city: 'TestCity' })
    }
    return null
  })
})

describe('VoiceDoc startRecording error handling', () => {
  it('sets an error message when microphone access is denied', async () => {
    // 1. Mock navigator.mediaDevices.getUserMedia to reject
    const mockGetUserMedia = vi.fn().mockRejectedValue(new Error('NotAllowedError: Permission denied'))

    // We need to define navigator and mediaDevices in a way that jsdom allows overriding
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia
      },
      writable: true,
      configurable: true,
    })

    // Mock speech synthesis as it's used in useEffect
    Object.defineProperty(window, 'speechSynthesis', {
      value: {
        cancel: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      },
      writable: true,
    })

    // 2. Render the component
    render(<VoiceDoc />)

    // 3. Find the mic button and click it to trigger startRecording
    // The button has title="Click to start 10s recording" or text 🎙️ when not recording
    const micButton = screen.getByTitle('Click to start 10s recording')
    fireEvent.click(micButton)

    // 4. Wait for the state to update and the error message to be rendered
    await waitFor(() => {
      const errorMessage = screen.getByText('Microphone access denied. Please allow microphone access to use VoiceDoc.')
      expect(errorMessage).toBeInTheDocument()
    })

    // Confirm that the mock was called
    expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true })
  })
})
