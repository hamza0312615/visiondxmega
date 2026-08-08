import assert from 'assert'
import { test, describe, afterEach, after } from 'node:test'
import { clearHeatmapData, getHeatmapData, HEATMAP_DATA_KEY } from './localStorage.js'

describe('clearHeatmapData', () => {
  const originalLocalStorage = global.localStorage
  const originalDocument = global.document
  const originalWindow = global.window
  const originalEvent = global.Event

  // Mock Browser Environment
  global.localStorage = {
    store: {},
    getItem(key) {
      return this.store[key] || null
    },
    removeItem(key) {
      delete this.store[key]
    },
    setItem(key, value) {
      this.store[key] = String(value)
    }
  }

  global.document = {
    cookie: '',
  }

  global.Event = class Event {
    constructor(name) {
      this.name = name
    }
  }

  global.window = {
    location: {
      hostname: 'localhost',
      reload() {}
    },
    dispatchEvent(event) {}
  }

  afterEach(() => {
    global.localStorage.store = {}
  })

  after(() => {
    global.localStorage = originalLocalStorage
    global.document = originalDocument
    global.window = originalWindow
    global.Event = originalEvent
  })

  test('should clear heatmap data from localStorage', () => {
    // Setup initial state
    global.localStorage.setItem(HEATMAP_DATA_KEY, JSON.stringify([{ city: 'Test', condition: 'Cold' }]))

    // Verify data exists
    const initialData = getHeatmapData()
    assert.strictEqual(initialData.length, 1, 'Heatmap data should initially have 1 entry')

    // Clear data
    clearHeatmapData()

    // Verify data is cleared
    const finalData = getHeatmapData()
    assert.strictEqual(finalData.length, 0, 'Heatmap data should be empty after clearHeatmapData')
    assert.strictEqual(global.localStorage.getItem(HEATMAP_DATA_KEY), null, 'localStorage should not have the heatmap key')
  })
})
