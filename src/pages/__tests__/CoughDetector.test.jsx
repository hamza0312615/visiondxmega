import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import CoughDetector from '../CoughDetector';
import React from 'react';

// Mock the API keys and dependencies
vi.mock('../../utils/apiKeys', () => ({
  getGoogleApiKey: vi.fn(() => 'test-key'),
  getHuggingFaceToken: vi.fn(() => 'test-token')
}));

describe('CoughDetector', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn(),
      },
      writable: true,
    });
  });

  it('shows error message when microphone access is denied', async () => {
    const errorMsg = 'Microphone access denied or not supported. Please allow microphone access or upload an audio file.';

    // Make getUserMedia throw an error
    global.navigator.mediaDevices.getUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

    // Spy on console.error to avoid cluttering test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CoughDetector />);

    // Find and click the record button
    const recordButton = screen.getByTitle('Click to start 5s recording');

    await act(async () => {
      fireEvent.click(recordButton);
    });

    // Check if error message is displayed
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleSpy.mockRestore();
  });
});
