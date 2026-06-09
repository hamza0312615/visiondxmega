import assert from 'assert'
import fs from 'fs'

// 1. Mock Browser Environment
global.localStorage = {
  store: {},
  getItem(key) {
    return this.store[key] || null
  },
  setItem(key, value) {
    this.store[key] = String(value)
  },
  removeItem(key) {
    delete this.store[key]
  },
  clear() {
    this.store = {}
  }
}

global.window = {
  speechSynthesis: {
    cancel: () => {
      global.window.speechSynthesis.cancelCalled = true
    },
    speak: (utterance) => {
      global.window.speechSynthesis.speakCalled = true
      global.window.speechSynthesis.lastUtterance = utterance
      setTimeout(() => {
        if (utterance.onstart) utterance.onstart()
        setTimeout(() => {
          if (utterance.onend) utterance.onend()
        }, 10)
      }, 0)
    },
    getVoices: () => [],
    cancelCalled: false,
    speakCalled: false,
    lastUtterance: null
  }
}

global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text
    this.lang = ''
    this.rate = 1
    this.voice = null
    this.onstart = null
    this.onend = null
    this.onerror = null
  }
}

global.Audio = class {
  constructor(url) {
    this.url = url
    this.paused = true
    this.currentTime = 0
    this.onplay = null
    this.onended = null
    this.onerror = null
    global.Audio.instances.push(this)
  }
  static instances = []
  play() {
    this.paused = false
    if (this.onplay) this.onplay()
    return Promise.resolve()
  }
  pause() {
    this.paused = true
    this.pauseCalled = true
  }
  pauseCalled = false
}

global.URL = {
  createObjectURL: (blob) => 'blob:mock-url'
}

global.fetch = async (url, options) => {
  return {
    ok: true,
    blob: async () => ({})
  }
}

globalThis.importMetaEnv = {
  VITE_ELEVENLABS_API_KEY: '',
  VITE_WA_BACKEND_URL: ''
}

// 2. Import MOCKED Module
import { speakText, cancelSpeech } from './src/utils/ttsService.mock.js'

console.log('🧪 Starting ttsService Tests...')

async function runTests() {
  try {
    // Test cancelSpeech
    console.log('\n  Running Test: cancelSpeech...')

    // Simulate active audio
    await speakText('Hello', 'en-US')
    const audioInstance = global.Audio.instances[global.Audio.instances.length - 1]

    cancelSpeech()

    assert.strictEqual(audioInstance.pauseCalled, true, 'Audio.pause() should be called')
    assert.strictEqual(audioInstance.currentTime, 0, 'Audio.currentTime should be reset to 0')
    assert.strictEqual(global.window.speechSynthesis.cancelCalled, true, 'speechSynthesis.cancel() should be called')

    console.log('  [✓] cancelSpeech Test Passed.')

    // Reset mocks
    global.window.speechSynthesis.cancelCalled = false
    global.window.speechSynthesis.speakCalled = false
    global.Audio.instances = []

    // Test speakText calls cancelSpeech
    console.log('\n  Running Test: speakText calls cancelSpeech...')
    await speakText('Test', 'en-US')
    assert.strictEqual(global.window.speechSynthesis.cancelCalled, true, 'speakText should call cancelSpeech')
    console.log('  [✓] speakText calls cancelSpeech Test Passed.')

    // Test ElevenLabs path
    console.log('\n  Running Test: ElevenLabs path...')
    globalThis.importMetaEnv.VITE_ELEVENLABS_API_KEY = 'fake-key'
    let onStartCalled = false
    await speakText('ElevenLabs test', 'en-US', { onStart: () => onStartCalled = true })
    assert.ok(global.Audio.instances.length > 0, 'Should create Audio instance for ElevenLabs')
    assert.ok(global.Audio.instances[global.Audio.instances.length - 1].url.startsWith('blob:'), 'URL should be a blob URL')
    assert.strictEqual(onStartCalled, true, 'onStart should be called')
    console.log('  [✓] ElevenLabs path Test Passed.')

    // Test Fallback to Native TTS
    console.log('\n  Running Test: Fallback to Native TTS...')
    globalThis.importMetaEnv.VITE_ELEVENLABS_API_KEY = ''
    global.fetch = async () => ({ ok: false })
    const originalAudio = global.Audio
    global.Audio = class extends originalAudio {
      constructor(url) {
        super(url)
        if (url.includes('/api/tts')) {
          setTimeout(() => {
            if (this.onerror) this.onerror(new Error('Mock Audio Error'))
          }, 0)
        }
      }
      play() {
        if (this.url.includes('/api/tts')) {
            return Promise.reject(new Error('Mock Play Error'))
        }
        return super.play()
      }
    }
    global.Audio.instances = []

    await speakText('Native fallback test', 'en-US')
    await new Promise(resolve => setTimeout(resolve, 100))

    assert.strictEqual(global.window.speechSynthesis.speakCalled, true, 'speechSynthesis.speak should be called as fallback')
    assert.strictEqual(global.window.speechSynthesis.lastUtterance.text, 'Native fallback test', 'Correct text should be spoken')

    console.log('  [✓] Fallback to Native TTS Test Passed.')

    console.log('\n🎉 ALL ttsService TESTS PASSED SUCCESSFULLY!')

  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE DETECTED:')
    console.error(err)
    process.exit(1)
  }
}

runTests()
