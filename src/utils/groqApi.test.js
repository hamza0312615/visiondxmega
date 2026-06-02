import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeText } from './groqApi';
import * as localStorageUtils from './localStorage';

// Mock the getApiKey function from localStorage
vi.mock('./localStorage', () => ({
  getApiKey: vi.fn(),
}));

describe('analyzeText', () => {
  const mockApiKey = 'test-api-key';
  const mockPrompt = 'Test prompt';
  const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully analyze text when provided a valid prompt and API key', async () => {
    const mockResponseText = 'This is a test response';
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponseText,
            },
          },
        ],
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await analyzeText(mockPrompt, mockApiKey);

    expect(result).toBe(mockResponseText);
    expect(global.fetch).toHaveBeenCalledWith(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: mockPrompt,
          },
        ],
        max_tokens: 1536,
        temperature: 0.3,
      }),
    });
  });

  it('should use API key from localStorage if not provided as argument', async () => {
    const mockResponseText = 'This is a test response';
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: mockResponseText,
            },
          },
        ],
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);
    vi.mocked(localStorageUtils.getApiKey).mockReturnValue(mockApiKey);

    const result = await analyzeText(mockPrompt);

    expect(result).toBe(mockResponseText);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockApiKey}`,
        }),
      })
    );
  });

  it('should throw an error if no API key is provided and none is in localStorage', async () => {
    vi.mocked(localStorageUtils.getApiKey).mockReturnValue(null);

    await expect(analyzeText(mockPrompt)).rejects.toThrow('No API key found. Please set your Groq API key in Settings.');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should throw an error with API message if fetch fails and returns an error payload', async () => {
    const apiErrorMessage = 'Invalid API key';
    const mockResponse = {
      ok: false,
      status: 401,
      json: vi.fn().mockResolvedValue({
        error: {
          message: apiErrorMessage,
        },
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(analyzeText(mockPrompt, mockApiKey)).rejects.toThrow(apiErrorMessage);
  });

  it('should throw a generic error if fetch fails and returns no specific error payload', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Failed to parse JSON')), // Simulated json() error
    };
    global.fetch.mockResolvedValue(mockResponse);

    await expect(analyzeText(mockPrompt, mockApiKey)).rejects.toThrow('API Error: 500');
  });

  it('should return an empty string if choices array is empty', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [],
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await analyzeText(mockPrompt, mockApiKey);

    expect(result).toBe('');
  });

  it('should return an empty string if choices array is undefined', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await analyzeText(mockPrompt, mockApiKey);

    expect(result).toBe('');
  });

  it('should return an empty string if message content is undefined', async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {},
          },
        ],
      }),
    };
    global.fetch.mockResolvedValue(mockResponse);

    const result = await analyzeText(mockPrompt, mockApiKey);

    expect(result).toBe('');
  });
});
