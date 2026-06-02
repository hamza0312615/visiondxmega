import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SkinAnalyzer from './SkinAnalyzer'
import * as groqApi from '../utils/groqApi'

// Mock the API module
vi.mock('../utils/groqApi', () => ({
  analyzeImage: vi.fn(),
}))

// Mock localStorage utils to avoid simulated fallback mode
vi.mock('../utils/localStorage', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getApiKey: vi.fn(() => 'mock-api-key'),
    isDemoMode: vi.fn(() => false),
  }
})

describe('SkinAnalyzer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Polyfill URL.createObjectURL since it's not in JSDOM
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    }
  })

  it('handles analyzeImage catch block and sets error', async () => {
    const errorMessage = 'Custom Mock API Error Message'
    groqApi.analyzeImage.mockRejectedValue(new Error(errorMessage))

    render(<SkinAnalyzer />)

    // Need to get the input file
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).not.toBeNull()

    // Upload an image to enable the Analyze button
    const file = new File(['dummy'], 'test.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Check if Change Photo is available, which means image preview is set
    await waitFor(() => {
      expect(screen.getByText('Change Photo')).toBeInTheDocument()
    })

    // Find and click the Analyze button
    const analyzeButton = screen.getByText(/Analyze Skin with Vision AI/i)
    fireEvent.click(analyzeButton)

    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})
