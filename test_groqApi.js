import assert from 'assert'

// 1. Mock Global Environment
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null },
  setItem(key, value) { this.store[key] = String(value) },
  removeItem(key) { delete this.store[key] },
  clear() { this.store = {} }
}

global.document = { cookie: '' }
global.Event = class Event { constructor(name) { this.name = name } }
global.window = { location: { hostname: 'localhost', reload() {} }, dispatchEvent() {} }

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  append(key, value, filename) {
    this.data.set(key, { value, filename });
  }
  get(key) {
    return this.data.get(key);
  }
}

// Mock Blob
global.Blob = class Blob {
  constructor(content, options) {
    this.content = content;
    this.options = options;
  }
}

let fetchCallArgs = null;
global.fetch = async (...args) => {
  fetchCallArgs = args;
  return {
    ok: true,
    json: async () => ({ text: 'mocked transcription' })
  };
};

import { transcribeAudio } from './src/utils/groqApi.js'
import { setApiKey } from './src/utils/localStorage.js'

async function runTests() {
  console.log('🧪 Starting VisionDX Mega Groq API Tests...')

  try {
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/webm' })

    // Test 1: Successful transcription
    console.log('\n  Running Test 1: Successful Audio Transcription...')
    const result = await transcribeAudio(audioBlob, 'test_api_key_1')

    assert.strictEqual(result, 'mocked transcription', 'Should return the transcribed text')
    assert.ok(fetchCallArgs, 'Fetch should have been called')

    const [url, options] = fetchCallArgs
    assert.strictEqual(url, 'https://api.groq.com/openai/v1/audio/transcriptions', 'Should hit correct URL')
    assert.strictEqual(options.method, 'POST', 'Should be a POST request')
    assert.strictEqual(options.headers['Authorization'], 'Bearer test_api_key_1', 'Should set correct Authorization header')

    assert.ok(options.body instanceof FormData, 'Body should be FormData')
    assert.strictEqual(options.body.get('file').filename, 'audio.webm', 'Should append file with correct filename')
    assert.strictEqual(options.body.get('model').value, 'whisper-large-v3', 'Should set correct model')
    assert.strictEqual(options.body.get('response_format').value, 'json', 'Should set correct response format')

    console.log('  [✓] Test 1 Passed successfully.')

    // Test 2: Error handling
    console.log('\n  Running Test 2: Transcription Error Handling...')
    global.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: 'Invalid audio format' } })
    })

    try {
      await transcribeAudio(audioBlob, 'test_api_key_2')
      assert.fail('Should have thrown an error')
    } catch (err) {
      assert.strictEqual(err.message, 'Invalid audio format', 'Should extract error message from API response')
    }

    console.log('  [✓] Test 2 Passed successfully.')

    // Test 3: No API Key
    console.log('\n  Running Test 3: Missing API Key Handling...')

    // Ensure localStorage is cleared and we pass null
    global.localStorage.clear()

    try {
      await transcribeAudio(audioBlob, null)
      assert.fail('Should have thrown an error for missing API key')
    } catch (err) {
      assert.strictEqual(err.message, 'No API key found. Please set your Groq API key in Settings.', 'Should fail if no API key')
    }

    console.log('  [✓] Test 3 Passed successfully.')

    console.log('\n🎉 ALL GROQ API TESTS PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE DETECTED:')
    console.error(err)
    process.exit(1)
  }
}

runTests()
