import { describe, it, expect, vi, beforeEach } from 'vitest'
import { clearHeatmapData, HEATMAP_DATA_KEY } from './localStorage'

describe('localStorage utils', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('clearHeatmapData', () => {
    it('should call localStorage.removeItem with the correct key', () => {
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

      clearHeatmapData()

      expect(removeItemSpy).toHaveBeenCalledWith(HEATMAP_DATA_KEY)
    })

    it('should actually remove the item from localStorage', () => {
      const key = HEATMAP_DATA_KEY
      localStorage.setItem(key, JSON.stringify([{ city: 'Test', condition: 'Test' }]))

      expect(localStorage.getItem(key)).not.toBeNull()

      clearHeatmapData()

      expect(localStorage.getItem(key)).toBeNull()
    })
  })
})
