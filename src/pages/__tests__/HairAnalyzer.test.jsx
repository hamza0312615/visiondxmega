import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HairAnalyzer from '../HairAnalyzer'
import * as groqApi from '../../utils/groqApi'
import * as localStorageUtils from '../../utils/localStorage'

// Mocking dependencies
vi.mock('../../utils/groqApi', () => ({
  analyzeImage: vi.fn(),
}))

vi.mock('../../utils/localStorage', () => ({
  saveResult: vi.fn(),
  isDemoMode: vi.fn(() => false),
  setDemoMode: vi.fn(),
  getApiKey: vi.fn(() => 'fake-key'),
}))

vi.mock('../../components/ResultCard', () => ({
  default: () => <div data-testid="result-card">Result Card Mock</div>,
}))

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}))

vi.mock('../../components/WebcamCapture', () => ({
  default: ({ onCapture }) => (
    <div>
      <button onClick={() => onCapture(new File([''], 'webcam.png', { type: 'image/png' }))}>
        Capture Webcam
      </button>
    </div>
  ),
}))

vi.mock('../../components/Skeleton', () => ({
  default: () => <div data-testid="skeleton">Skeleton Mock</div>,
}))

describe('HairAnalyzer Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // By default, not demo mode
    localStorageUtils.isDemoMode.mockReturnValue(false)
  })

  it('displays error message when analyzeImage throws an error', async () => {
    const errorMessage = 'API rate limit exceeded'
    groqApi.analyzeImage.mockRejectedValueOnce(new Error(errorMessage))

    render(<HairAnalyzer />)

    // Upload an image
    const file = new File(['hello'], 'hello.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Browse Files/i)
    fireEvent.change(input, { target: { files: [file] } })

    // Wait for the preview to be generated, then button should be active
    const analyzeButton = screen.getByRole('button', { name: /Analyze Hair with Trichology AI/i })
    expect(analyzeButton).not.toBeDisabled()

    // Click analyze
    fireEvent.click(analyzeButton)

    // Assert that the error is displayed
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes(errorMessage)
      })).toBeInTheDocument()
    })

    // Assert that analyzeImage was called
    expect(groqApi.analyzeImage).toHaveBeenCalledTimes(1)
  })

  it('displays default error message when analyzeImage throws an error without message', async () => {
    groqApi.analyzeImage.mockRejectedValueOnce(new Error())

    render(<HairAnalyzer />)

    // Upload an image
    const file = new File(['hello'], 'hello.png', { type: 'image/png' })
    const input = screen.getByLabelText(/Browse Files/i)
    fireEvent.change(input, { target: { files: [file] } })

    const analyzeButton = screen.getByRole('button', { name: /Analyze Hair with Trichology AI/i })
    fireEvent.click(analyzeButton)

    // Assert that the default error is displayed
    await waitFor(() => {
      expect(screen.getByText((content, element) => {
        return content.includes('Failed to analyze hair image. Please check your API key or try again.')
      })).toBeInTheDocument()
    })
  })
})
