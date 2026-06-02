import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})

// Mock window and global objects for tests
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.window.speechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
}

global.navigator.mediaDevices = {
  getUserMedia: vi.fn(),
}

global.MediaRecorder = class MediaRecorder {
  constructor() {}
  start() {}
  stop() {}
}
