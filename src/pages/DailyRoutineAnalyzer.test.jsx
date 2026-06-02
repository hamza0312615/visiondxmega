import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import DailyRoutineAnalyzer from './DailyRoutineAnalyzer'

// Mock the API utility
vi.mock('../utils/groqApi', () => ({
  analyzeText: vi.fn()
}))

// Mock localStorage utilities
vi.mock('../utils/localStorage', () => ({
  saveResult: vi.fn(),
  isDemoMode: vi.fn(() => false),
  setDemoMode: vi.fn(),
  getDemoData: vi.fn(() => null)
}))

import { analyzeText } from '../utils/groqApi'

describe('DailyRoutineAnalyzer Error Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock the global localStorage for the component's internal use
    const localStorageMock = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn()
    }
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('displays an error message when handleAnalyze catches an error', async () => {
    // Setup the API mock to reject with an error
    const errorMessage = 'API error occurred'
    analyzeText.mockRejectedValueOnce(new Error(errorMessage))

    // Render the component
    render(<DailyRoutineAnalyzer />)

    // Trigger the analysis (submit the form)
    const compileButton = screen.getByRole('button', { name: /Compile Lifestyle Prescription/i })
    fireEvent.click(compileButton)

    // Wait for the catch block to execute and the error state to update
    await waitFor(() => {
      // The component displays the error message, or defaults if not provided.
      // We check for the specific error message text in the document.
      expect(screen.getByText((content, element) => {
        return element.tagName.toLowerCase() === 'div' && content.includes(errorMessage)
      })).toBeInTheDocument()
    })
  })
})
