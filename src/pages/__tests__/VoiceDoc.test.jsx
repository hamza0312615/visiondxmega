import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VoiceDoc from '../VoiceDoc';

// Mock all internal components and utilities
vi.mock('../../utils/groqApi', () => ({
  transcribeAudio: vi.fn(),
  analyzeText: vi.fn()
}));
vi.mock('../../utils/localStorage', () => ({
  saveResult: vi.fn(),
  getWhatsAppConfig: vi.fn(() => ({ doctorPhone: '923001234567' }))
}));
vi.mock('../../components/ResultCard', () => ({
  default: () => <div data-testid="result-card">ResultCard</div>
}));
vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">LoadingSpinner</div>
}));
vi.mock('../../components/Skeleton', () => ({
  default: () => <div data-testid="skeleton">Skeleton</div>
}));

describe('VoiceDoc stopRecordingEarly edge cases', () => {
  let mockMediaRecorder;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: vi.fn(),
      onstop: vi.fn()
    };

    global.MediaRecorder = class {
      constructor() {
        return mockMediaRecorder;
      }
    };

    global.navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: vi.fn(() => [])
      })
    };
  });

  it('calls stopRecordingEarly when recording is active and stops the mediaRecorder', async () => {
    render(<VoiceDoc />);

    const recordBtn = screen.getByTitle('Click to start 10s recording');

    // Start recording
    await act(async () => {
      fireEvent.click(recordBtn);
    });

    // Check that MediaRecorder was instantiated and started
    expect(mockMediaRecorder.start).toHaveBeenCalled();

    // Wait for the button to switch state (which implies `recording` is true)
    await waitFor(() => {
      expect(screen.getByTitle('Click to stop recording early')).toBeInTheDocument();
    });

    const stopBtn = screen.getByTitle('Click to stop recording early');

    // Now trigger the stopRecordingEarly function by clicking the button
    await act(async () => {
      fireEvent.click(stopBtn);
    });

    // Verify that stop() is called on the media recorder
    expect(mockMediaRecorder.stop).toHaveBeenCalled();

    // Wait for the button to switch back to start recording state
    await waitFor(() => {
      expect(screen.getByTitle('Click to start 10s recording')).toBeInTheDocument();
    });
  });
});
