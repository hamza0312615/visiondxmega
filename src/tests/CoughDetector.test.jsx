import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CoughDetector from '../pages/CoughDetector'
import { vi } from 'vitest'

describe('CoughDetector', () => {
  it('shows error for invalid file type', async () => {
    render(
      <MemoryRouter>
        <CoughDetector />
      </MemoryRouter>
    )

    const fileInput = screen.getByLabelText(/Browse Audio File/i)

    // Create an invalid file
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' })

    // Trigger change event
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Check for error message
    const errorMessage = await screen.findByText('Please upload a valid audio file (WAV, MP3, M4A, WEBM).')
    expect(errorMessage).toBeInTheDocument()
  })

  it('accepts valid audio file', async () => {
    render(
      <MemoryRouter>
        <CoughDetector />
      </MemoryRouter>
    )

    const fileInput = screen.getByLabelText(/Browse Audio File/i)

    // Create a valid file
    const file = new File(['dummy content'], 'test.wav', { type: 'audio/wav' })

    // Trigger change event
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Check that it accepted the file (the file name is displayed)
    const fileNameDisplay = await screen.findByText(/Selected: test\.wav/i)
    expect(fileNameDisplay).toBeInTheDocument()

    // Check that there's no error message
    const errorMessage = screen.queryByText('Please upload a valid audio file (WAV, MP3, M4A, WEBM).')
    expect(errorMessage).not.toBeInTheDocument()
  })
})
