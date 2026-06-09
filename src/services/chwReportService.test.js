import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCHWReportText } from './chwReportService';
import { analyzeText } from '../utils/groqApi';

vi.mock('../utils/groqApi', () => ({
  analyzeText: vi.fn(),
}));

describe('chwReportService', () => {
  const mockPatient = {
    name: 'John Doe',
    age: '45',
    gender: 'Male',
    phone: '+923001234567'
  };

  const mockRecords = [
    {
      moduleName: 'Eye Scan',
      riskLevel: 'warning',
      summary: 'Potential conjunctivitis detected.',
      data: { details: { eye: 'left' } }
    },
    {
      moduleName: 'Skin Scan',
      riskLevel: 'critical',
      summary: 'Irregular lesion detected.',
      data: { details: { location: 'arm' } }
    }
  ];

  const workerName = 'CHW Agent 1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateCHWReportText', () => {
    it('should return "No diagnostic data recorded." if records are empty', async () => {
      const result = await generateCHWReportText(mockPatient, [], workerName);
      expect(result).toBe('No diagnostic data recorded.');
    });

    it('should return AI generated text on success', async () => {
      const mockAiResponse = '🏥 *VISIONDX CHW FIELD REPORT* 🏥\n\nPatient: John Doe\nFindings: Issues found.';
      vi.mocked(analyzeText).mockResolvedValue(mockAiResponse);

      const result = await generateCHWReportText(mockPatient, mockRecords, workerName);

      expect(analyzeText).toHaveBeenCalled();
      expect(result).toBe(mockAiResponse);
    });

    it('should return a fallback report if analyzeText fails', async () => {
      vi.mocked(analyzeText).mockRejectedValue(new Error('AI Service Down'));

      const result = await generateCHWReportText(mockPatient, mockRecords, workerName);

      expect(analyzeText).toHaveBeenCalled();
      expect(result).toContain('🏥 *VISIONDX CHW FIELD REPORT* 🏥');
      expect(result).toContain('*Patient:* John Doe');
      expect(result).toContain('*Age/Gender:* 45 / Male');
      expect(result).toContain('*Urgency Assessment:* 🔴 HIGH URGENCY');
      expect(result).toContain('(Auto-generated fallback report due to AI generation error)');
      expect(result).toContain('- Eye Scan: Potential conjunctivitis detected.');
      expect(result).toContain('- Skin Scan: Irregular lesion detected.');
    });

    it('should correctly identify moderate urgency in fallback if warning is highest', async () => {
      vi.mocked(analyzeText).mockRejectedValue(new Error('AI Service Down'));
      const recordsWithWarning = [
        { moduleName: 'Eye Scan', riskLevel: 'warning', summary: 'Warning', data: {} },
        { moduleName: 'Skin Scan', riskLevel: 'normal', summary: 'Normal', data: {} }
      ];

      const result = await generateCHWReportText(mockPatient, recordsWithWarning, workerName);

      expect(result).toContain('*Urgency Assessment:* 🟡 MODERATE URGENCY');
    });

    it('should correctly identify low urgency in fallback if all are normal', async () => {
      vi.mocked(analyzeText).mockRejectedValue(new Error('AI Service Down'));
      const normalRecords = [
        { moduleName: 'Eye Scan', riskLevel: 'normal', summary: 'Normal', data: {} }
      ];

      const result = await generateCHWReportText(mockPatient, normalRecords, workerName);

      expect(result).toContain('*Urgency Assessment:* 🟢 LOW URGENCY');
    });
  });
});
