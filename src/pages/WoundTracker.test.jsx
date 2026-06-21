import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import WoundTracker from './WoundTracker'
import * as groqApi from '../utils/groqApi'
import * as localStorageUtils from '../utils/localStorage'

vi.mock('../utils/groqApi', () => ({
  analyzeImage: vi.fn()
}))

vi.mock('../utils/localStorage', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    getApiKey: vi.fn(() => 'fake-api-key'),
    saveResult: vi.fn((type, data) => ({ id: 1, ...data })),
    getHistoryByType: vi.fn(() => []),
    getDemoData: vi.fn(() => null),
    isDemoMode: vi.fn(() => false)
  }
})

describe('WoundTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.URL.createObjectURL = vi.fn(() => 'mock-url')
  })

  it('displays error message when analyzeImage throws an error', async () => {
    const errorMessage = 'API limit exceeded'
    groqApi.analyzeImage.mockRejectedValueOnce(new Error(errorMessage))

    const { container } = render(<WoundTracker />)

    // Fill in location
    const locationInput = screen.getByPlaceholderText('e.g. Left Forearm, Right Shin')
    fireEvent.change(locationInput, { target: { value: 'Left Forearm' } })

    // Simulate image upload
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })
    const fileInput = container.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit form
    const form = container.querySelector('form')
    fireEvent.submit(form)

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })
})
