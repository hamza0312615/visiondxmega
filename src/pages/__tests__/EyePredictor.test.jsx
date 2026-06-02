import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, describe, beforeEach } from 'vitest';
import EyePredictor from '../EyePredictor';

// Mocking child components and dependencies
vi.mock('../../utils/groqApi', () => ({
  analyzeImage: vi.fn(),
}));

vi.mock('../../utils/localStorage', () => ({
  saveResult: vi.fn(),
  isDemoMode: vi.fn(),
  setDemoMode: vi.fn(),
  getApiKey: vi.fn(),
}));

vi.mock('../../data/disease_data.json', () => ({
  default: { eye: { 'Test Disease': {} } },
}));

vi.mock('../../data/demoPresets', () => ({
  demoPresets: { eye: [] },
}));

vi.mock('../../components/ResultCard', () => ({
  default: () => <div data-testid="result-card" />,
}));

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner" />,
}));

vi.mock('../../components/WebcamCapture', () => ({
  default: () => <div data-testid="webcam-capture" />,
}));

vi.mock('../../components/Skeleton', () => ({
  default: () => <div data-testid="skeleton" />,
}));

describe('EyePredictor handleImageChange', () => {
  beforeEach(() => {
    // Clear mocks and reset window.URL.createObjectURL
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => 'mocked-url');
  });

  test('sets error when file type is not an image', async () => {
    render(<EyePredictor />);

    // Find the file input. It might be hidden, so we find it by label or role/test id if present.
    // In EyePredictor.jsx:
    // <input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} className="hidden" />

    // There's a label "Browse Files" or we can get all inputs of type file
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const uploadInput = fileInputs[0];

    // Create an invalid mock file
    const invalidFile = new File(['mock content'], 'test.txt', { type: 'text/plain' });

    // Trigger change event
    fireEvent.change(uploadInput, { target: { files: [invalidFile] } });

    // Verify error is shown
    await waitFor(() => {
      expect(screen.getByText('Please upload a valid image file.')).toBeInTheDocument();
    });
  });

  test('does not set error when file type is an image', async () => {
    render(<EyePredictor />);

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const uploadInput = fileInputs[0];

    // Create a valid mock file
    const validFile = new File(['mock content'], 'test.png', { type: 'image/png' });

    // Trigger change event
    fireEvent.change(uploadInput, { target: { files: [validFile] } });

    // Check that error is not shown and window.URL.createObjectURL was called
    await waitFor(() => {
      expect(screen.queryByText('Please upload a valid image file.')).not.toBeInTheDocument();
    });

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(validFile);
  });
});
