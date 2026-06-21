import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveResult,
  getHistory,
  getHistoryByType,
  deleteEntry,
  clearHistory,
  getApiKey,
  setApiKey,
  getWhatsAppConfig,
  setWhatsAppConfig,
  getSiteLanguage,
  setSiteLanguage,
  isDemoMode,
  setDemoMode,
  getRiskLog,
  saveRiskLog,
  getHeatmapOptIn,
  setHeatmapOptIn,
  getHeatmapData,
  saveHeatmapEntry,
  clearHeatmapData,
  getDemoData,
  STORAGE_KEY,
  WHATSAPP_KEY,
  API_KEY,
  SITE_LANG_KEY,
  IS_DEMO_KEY,
  RISK_LOG_KEY,
  HEATMAP_DATA_KEY,
  HEATMAP_OPT_IN_KEY
} from './localStorage'

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    // Mock window.location.reload
    vi.stubGlobal('location', {
      ...window.location,
      reload: vi.fn(),
      hostname: 'localhost'
    })

    // Mock document.cookie
    vi.stubGlobal('document', {
      cookie: ''
    })
  })

  describe('clearHistory', () => {
    it('should call localStorage.removeItem with STORAGE_KEY', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
      clearHistory()
      expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY)
    })

    it('should result in an empty history', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([{ id: '1' }]))
      clearHistory()
      expect(getHistory()).toEqual([])
    })
  })

  describe('History Operations', () => {
    it('should save and retrieve history', () => {
      const data = { result: 'test' }
      const entry = saveResult('eye', data)

      expect(entry.type).toBe('eye')
      expect(entry.result).toBe('test')
      expect(entry.id).toBeDefined()
      expect(entry.timestamp).toBeDefined()

      const history = getHistory()
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(entry)
    })

    it('should limit history to 200 entries', () => {
      for (let i = 0; i < 210; i++) {
        saveResult('test', { i })
      }
      expect(getHistory()).toHaveLength(200)
    })

    it('should filter history by type', () => {
      saveResult('eye', { id: 1 })
      saveResult('skin', { id: 2 })

      const eyeHistory = getHistoryByType('eye')
      expect(eyeHistory).toHaveLength(1)
      expect(eyeHistory[0].type).toBe('eye')
    })

    it('should delete an entry by id', () => {
      const entry1 = saveResult('eye', { id: 1 })
      const entry2 = saveResult('skin', { id: 2 })

      deleteEntry(entry1.id)
      const history = getHistory()
      expect(history).toHaveLength(1)
      expect(history[0].id).toBe(entry2.id)
    })

    it('should return empty array if JSON is invalid', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json')
      expect(getHistory()).toEqual([])
    })
  })

  describe('API Key', () => {
    it('should set and get API key', () => {
      setApiKey('test-key')
      expect(getApiKey()).toBe('test-key')
    })
  })

  describe('WhatsApp Config', () => {
    it('should return default config if none exists', () => {
      const config = getWhatsAppConfig()
      expect(config.doctorPhone).toBe('923001234567')
    })

    it('should set and get config', () => {
      setWhatsAppConfig({ doctorPhone: '123456789' })
      const config = getWhatsAppConfig()
      expect(config.doctorPhone).toBe('123456789')
    })
  })

  describe('Demo Mode', () => {
    it('should toggle demo mode', () => {
      expect(isDemoMode()).toBe(false)
      setDemoMode(true)
      expect(isDemoMode()).toBe(true)
    })
  })

  describe('Risk Log', () => {
    it('should save and get risk log', () => {
      saveRiskLog('NORMAL')
      saveRiskLog('EMERGENCY')

      const log = getRiskLog()
      expect(log).toHaveLength(2)
      expect(log[0].urgency).toBe('NORMAL')
      expect(log[0].score).toBe(20)
      expect(log[1].urgency).toBe('EMERGENCY')
      expect(log[1].score).toBe(85)
    })
  })

  describe('Heatmap', () => {
    it('should not save if not opted in', () => {
      setHeatmapOptIn(false)
      saveHeatmapEntry('London', 'Cough')
      expect(getHeatmapData()).toHaveLength(0)
    })

    it('should save if opted in', () => {
      setHeatmapOptIn(true)
      saveHeatmapEntry('London', 'Cough')
      expect(getHeatmapData()).toHaveLength(1)
      expect(getHeatmapData()[0].city).toBe('London')
    })

    it('should clear heatmap data', () => {
      setHeatmapOptIn(true)
      saveHeatmapEntry('London', 'Cough')
      clearHeatmapData()
      expect(getHeatmapData()).toHaveLength(0)
    })
  })

  describe('Demo Data', () => {
    it('should return eye demo data', () => {
      const data = getDemoData('eye')
      expect(data.symptoms).toContain('Conjunctivitis')
    })

    it('should return null for unknown module', () => {
      expect(getDemoData('unknown')).toBeNull()
    })
  })
})
