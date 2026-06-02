import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MedicineAnalyzer from './MedicineAnalyzer'

// Mock the global URL.createObjectURL since it's not available in jsdom
global.URL.createObjectURL = vi.fn()

describe('MedicineAnalyzer', () => {
  it('displays an error when an invalid non-image file is uploaded', async () => {
    render(
      <MemoryRouter>
        <MedicineAnalyzer />
      </MemoryRouter>
    )

    // Wait for the "Upload Image" input to be available
    // It is labeled by a parent element or just an input with type file
    const fileInput = await screen.findByLabelText(/Upload Image/i, { selector: 'input[type="file"]' }).catch(() => {
        // Find input by searching all inputs if label association fails
        return document.querySelector('input[type="file"]')
    })

    expect(fileInput).toBeInTheDocument()

    // Create an invalid mock file (e.g., a PDF document)
    const invalidFile = new File(['dummy content'], 'document.pdf', {
      type: 'application/pdf',
    })

    // Simulate selecting the invalid file
    fireEvent.change(fileInput, { target: { files: [invalidFile] } })

    // Verify the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Please upload a valid image file.')).toBeInTheDocument()
    })
  })
})
