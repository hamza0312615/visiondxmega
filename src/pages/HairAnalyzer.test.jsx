import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HairAnalyzer from './HairAnalyzer'

// Mock the components and utils to simplify testing
vi.mock('../utils/groqApi', () => ({
  analyzeImage: vi.fn()
}))

vi.mock('../utils/localStorage', () => ({
  saveResult: vi.fn(),
  isDemoMode: vi.fn(() => false),
  setDemoMode: vi.fn(),
  getApiKey: vi.fn(() => 'mock-api-key')
}))

vi.mock('../components/ResultCard', () => ({
  default: () => <div data-testid="result-card" />
}))

vi.mock('../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />
}))

vi.mock('../components/WebcamCapture', () => ({
  default: () => <div data-testid="webcam-capture" />
}))

vi.mock('../components/Skeleton', () => ({
  default: () => <div data-testid="skeleton" />
}))

// Mock URL.createObjectURL to prevent errors
global.URL.createObjectURL = vi.fn(() => 'mock-url')

describe('HairAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an error when uploading a file that is not an image', () => {
    render(<HairAnalyzer />)

    // The actual input is hidden inside the label. We can get it via querySelector or find by role/test id, but let's just find the file input directly
    // Since there might be multiple or it's hard to select, we can use container query
    const inputs = document.querySelectorAll('input[type="file"]')
    const fileInput = inputs[0] // Get the first one for upload

    // Create a mock file that is not an image
    const mockFile = new File(['dummy content'], 'test.txt', { type: 'text/plain' })

    // Simulate file upload
    fireEvent.change(fileInput, { target: { files: [mockFile] } })

    // Verify that the error message is displayed
    const errorMessage = screen.getByText('Please upload a valid image file.')
    expect(errorMessage).toBeInTheDocument()
  })
})
