/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendWhatsAppReport, generateCHWReportText } from './chwReportService';

describe('chwReportService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    vi.clearAllMocks();
  });

  describe('sendWhatsAppReport', () => {
    const mockPatient = { name: 'John Doe', phone: '+923052353337' };
    const mockReportText = 'Test Report Content';

    it('should successfully send a WhatsApp report', async () => {
      const mockResponse = { success: true, message: 'Message sent' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await sendWhatsAppReport(mockPatient, mockReportText);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://wasenderapi.com/api/send-message',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer 87aff4ff36918379d775c07af06aaceadb5315fb3972a60974eb5b8d6b680144',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: mockPatient.phone,
            text: mockReportText,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw an error if patient phone is missing', async () => {
      await expect(sendWhatsAppReport({ name: 'No Phone' }, 'Report'))
        .rejects.toThrow('Patient phone number is missing.');
    });

    it('should throw an error if API response is not ok', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invalid phone format' }),
      });

      await expect(sendWhatsAppReport(mockPatient, 'Report'))
        .rejects.toThrow('Invalid phone format');
    });

    it('should throw a default error message if API response is not ok and has no message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

      await expect(sendWhatsAppReport(mockPatient, 'Report'))
        .rejects.toThrow('Failed to send WhatsApp message via WaSender.');
    });

    it('should throw error on network failure', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(sendWhatsAppReport(mockPatient, 'Report'))
        .rejects.toThrow('Network failure');
    });
  });

  describe('generateCHWReportText', () => {
    const mockPatient = { name: 'John Doe', age: '30', gender: 'Male', phone: '+923052353337' };
    const mockRecords = [
      { moduleName: 'Eye Scan', riskLevel: 'critical', summary: 'Severe condition', data: { details: { redEye: true } } }
    ];

    it('should successfully generate report using AI', async () => {
      const mockAIResponse = 'AI Generated Report';
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: mockAIResponse } }]
        }),
      });

      // Mock localStorage for getApiKey in groqApi
      global.localStorage.getItem.mockReturnValue('mock-api-key');

      const result = await generateCHWReportText(mockPatient, mockRecords, 'CHW-001');

      expect(result).toBe(mockAIResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.groq.com'),
        expect.anything()
      );
    });

    it('should return "No diagnostic data recorded." if records are empty', async () => {
      const result = await generateCHWReportText(mockPatient, [], 'CHW-001');
      expect(result).toBe('No diagnostic data recorded.');
    });

    it('should fallback to static report if AI generation fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('AI Service Down'));

      const result = await generateCHWReportText(mockPatient, mockRecords, 'CHW-001');

      expect(result).toContain('🏥 *VISIONDX CHW FIELD REPORT* 🏥');
      expect(result).toContain('🔴 HIGH URGENCY');
      expect(result).toContain('*(Auto-generated fallback report due to AI generation error)*');
    });

    it('should handle "warning" risk level in fallback report', async () => {
        global.fetch.mockRejectedValueOnce(new Error('AI Service Down'));
        const warningRecords = [{ moduleName: 'Skin Scan', riskLevel: 'warning', summary: 'Mild rash' }];

        const result = await generateCHWReportText(mockPatient, warningRecords, 'CHW-001');

        expect(result).toContain('🟡 MODERATE URGENCY');
    });

    it('should handle "normal" risk level in fallback report', async () => {
        global.fetch.mockRejectedValueOnce(new Error('AI Service Down'));
        const normalRecords = [{ moduleName: 'Skin Scan', riskLevel: 'normal', summary: 'Clear' }];

        const result = await generateCHWReportText(mockPatient, normalRecords, 'CHW-001');

        expect(result).toContain('🟢 LOW URGENCY');
    });
  });
});
