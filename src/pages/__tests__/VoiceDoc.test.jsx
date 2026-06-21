import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import VoiceDoc from '../VoiceDoc';
import * as groqApi from '../../utils/groqApi';
import * as localStorageUtils from '../../utils/localStorage';

// Mock the API calls
vi.mock('../../utils/groqApi', () => ({
  transcribeAudio: vi.fn(),
  analyzeText: vi.fn(),
}));

// Mock local storage utils
vi.mock('../../utils/localStorage', () => ({
  saveResult: vi.fn(),
  getWhatsAppConfig: vi.fn(() => ({ doctorPhone: '1234567890' })),
  getItem: vi.fn(),
}));

describe('VoiceDoc Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
      configurable: true,
    });

    // Mock MediaRecorder
    global.MediaRecorder = class {
      constructor() {
        this.start = vi.fn();
        this.stop = vi.fn(() => {
          if (this.onstop) this.onstop();
        });
        this.ondataavailable = null;
        this.onstop = null;
      }
    };

    // Mock window.speechSynthesis
    global.window.speechSynthesis = {
      cancel: vi.fn(),
      getVoices: vi.fn(() => []),
      speak: vi.fn(),
    };
  });

  test('processVoice catch block updates error state correctly', async () => {
    const errorMessage = 'Network Error during transcription';
    groqApi.transcribeAudio.mockRejectedValue(new Error(errorMessage));

    render(<VoiceDoc />);

    // Click start recording button
    const micButton = screen.getByTitle('Click to start 10s recording');
    await userEvent.click(micButton);

    // We should be in recording state. Now simulate stop to trigger processVoice.
    const stopButton = screen.getByTitle('Click to stop recording early');
    await userEvent.click(stopButton);

    // Wait for the error message to appear in the UI
    await waitFor(() => {
      const errorDiv = screen.getByText(errorMessage);
      expect(errorDiv).toBeInTheDocument();
    });
  });
});
