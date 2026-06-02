import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import SleepAnalyzer from '../SleepAnalyzer'
import * as groqApi from '../../utils/groqApi'

// Mock the groqApi module
vi.mock('../../utils/groqApi', () => ({
  analyzeText: vi.fn(),
}))

describe('SleepAnalyzer', () => {
  it('handles errors from analyzeText in handleFormAnalyze', async () => {
    // Setup analyzeText to throw an error
    const errorMessage = 'API rate limit exceeded'
    groqApi.analyzeText.mockRejectedValue(new Error(errorMessage))

    render(<SleepAnalyzer />)

    // Find the Analyze button
    const analyzeButton = screen.getByRole('button', { name: /Analyze Sleep Quality/i })

    // Click the button
    fireEvent.click(analyzeButton)

    // Wait for the error message to appear
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    // Loading state should be false (button should be active)
    expect(analyzeButton).not.toBeDisabled()
  })
})
