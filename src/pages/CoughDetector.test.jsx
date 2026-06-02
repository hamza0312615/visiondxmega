import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import CoughDetector from './CoughDetector'
import { transcribeAudio } from '../utils/groqApi'

// Mock the groqApi functions
vi.mock('../utils/groqApi', () => ({
  transcribeAudio: vi.fn(),
  analyzeText: vi.fn(),
}))

// Mock localStorage utils so we don't hit the real ones
vi.mock('../utils/localStorage', () => ({
  isDemoMode: vi.fn(() => false),
  setDemoMode: vi.fn(),
  saveResult: vi.fn(),
  getDemoData: vi.fn(),
}))

// Mock matchMedia if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('CoughDetector Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle and display errors when transcribeAudio fails', async () => {
    // Setup the mock to throw an error
    const errorMessage = 'API Key is invalid or expired'
    transcribeAudio.mockRejectedValueOnce(new Error(errorMessage))

    render(<CoughDetector />)

    // Find the file input
    // The component hides the input, so we find it by label text or just querying the DOM
    const fileInput = document.querySelector('input[type="file"]')

    // Create a fake file
    const file = new File(['dummy content'], 'cough.mp3', { type: 'audio/mp3' })

    // Trigger the file upload
    await userEvent.upload(fileInput, file)

    // Wait for the error message to appear in the DOM
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Also check that it's no longer loading
    expect(screen.queryByText(/Transcribing cough sound/)).not.toBeInTheDocument()
  })
})
