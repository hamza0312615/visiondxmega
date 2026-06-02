import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import MedicineAnalyzer from './MedicineAnalyzer'
import * as groqApi from '../utils/groqApi'

vi.mock('../utils/groqApi', () => ({
  analyzeImage: vi.fn(),
  analyzeText: vi.fn()
}))

vi.mock('../utils/localStorage', () => ({
  saveResult: vi.fn(),
  isDemoMode: vi.fn(() => false),
  setDemoMode: vi.fn(),
  getApiKey: vi.fn(() => 'test-api-key')
}))

describe('MedicineAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles errors from handleAnalyze in catch block when analyzing image', async () => {
    const errorMessage = 'Failed to analyze medicine. Please check your API key or try again.'
    groqApi.analyzeImage.mockRejectedValue(new Error(errorMessage))

    render(<MedicineAnalyzer />)

    // Switch to Upload tab
    const uploadTab = screen.getByText('📁 Upload')
    fireEvent.click(uploadTab)

    const file = new File(['hello'], 'hello.png', { type: 'image/png' })
    const fileInput = document.querySelector('input[type="file"]')

    if(fileInput) {
       const mockReader = {
         readAsDataURL: vi.fn(function() {
           this.onload({ target: { result: 'data:image/png;base64,mockbase64' } })
         })
       }
       vi.spyOn(window, 'FileReader').mockImplementation(() => mockReader)

       fireEvent.change(fileInput, { target: { files: [file] } })
    }

    const analyzeButton = await screen.findByText(/Identify & Analyze Medicine/i)
    fireEvent.click(analyzeButton)

    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument()
    })
  })
})
