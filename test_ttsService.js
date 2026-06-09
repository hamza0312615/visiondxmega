import assert from 'assert'

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

// Polyfill import.meta.env for Vite environment variables
// Use a property descriptor to make it available on import.meta
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_ELEVENLABS_API_KEY: '',
    VITE_WA_BACKEND_URL: 'http://localhost:3001'
  },
  writable: true,
  configurable: true
});

// Mock Audio
let lastAudioInstance = null;
global.Audio = class {
  constructor(src) {
    this.src = src;
    this.onplay = null;
    this.onended = null;
    this.onerror = null;
    this.paused = true;
    lastAudioInstance = this;
  }
  async play() {
    this.paused = false;
    // Note: in the actual code, audio.play() is awaited.
    // We'll trigger onplay manually in tests if needed, or just let it be.
  }
  pause() {
    this.paused = true;
  }
}

// Mock fetch
let fetchCallCount = 0;
let lastFetchArgs = null;
global.fetch = async (url, options) => {
  fetchCallCount++;
  lastFetchArgs = { url, options };
  return global.fetchResponse || {
    ok: true,
    status: 200,
    blob: async () => ({})
  };
}

// Mock speechSynthesis
let lastUtterance = null;
let speechSynthesisCancelled = false;
global.window = {
  speechSynthesis: {
    speak(utterance) {
      lastUtterance = utterance;
      if (utterance.onstart) utterance.onstart();
    },
    cancel() {
      speechSynthesisCancelled = true;
    },
    getVoices() {
      return [
        { lang: 'en-US', name: 'English' },
        { lang: 'ur-PK', name: 'Urdu' }
      ];
    }
  }
}

global.SpeechSynthesisUtterance = class {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
    this.voice = null;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}

global.URL = {
  createObjectURL: (blob) => 'blob:dummy'
}

// 2. Import Module
import { speakText, cancelSpeech } from './src/utils/ttsService.js'

console.log('🧪 Starting ttsService Tests...')

async function testEmptyText() {
  console.log('  Running Test: Empty text handling...')
  let onEndCalled = false;
  await speakText('', 'en-US', { onEnd: () => { onEndCalled = true } });
  assert.strictEqual(onEndCalled, true, 'onEnd should be called for empty text');

  onEndCalled = false;
  await speakText('   ', 'en-US', { onEnd: () => { onEndCalled = true } });
  assert.strictEqual(onEndCalled, true, 'onEnd should be called for whitespace text');
  console.log('  [✓] Passed.')
}

async function testTextSanitization() {
  console.log('  Running Test: Text sanitization...')
  // Set ElevenLabs key in localStorage instead of import.meta.env
  global.localStorage.setItem('visiondx_elevenlabs_key', 'test-key');

  await speakText('**Hello** - World', 'en-US');
  const body = JSON.parse(lastFetchArgs.options.body);
  // Original code replaces '-' with '', so '**Hello** - World' becomes 'Hello  World' (double space)
  assert.strictEqual(body.text, 'Hello  World', 'Markdown characters should be removed');

  global.localStorage.removeItem('visiondx_elevenlabs_key');
  console.log('  [✓] Passed.')
}

async function testElevenLabsSuccess() {
  console.log('  Running Test: ElevenLabs Success...')
  global.localStorage.setItem('visiondx_elevenlabs_key', 'eleven-key');
  fetchCallCount = 0;

  let onStartCalled = false;
  const promise = speakText('Hello ElevenLabs', 'en-US', { onStart: () => { onStartCalled = true } });

  // Wait a bit for the async flow
  await new Promise(resolve => setTimeout(resolve, 0));

  assert.strictEqual(fetchCallCount, 1, 'fetch should be called');
  assert.ok(lastFetchArgs.url.includes('elevenlabs.io'), 'Should call ElevenLabs API');
  assert.strictEqual(lastFetchArgs.options.headers['xi-api-key'], 'eleven-key', 'Should use correct API key');

  // Manually trigger onplay to simulate audio starting
  if (lastAudioInstance.onplay) lastAudioInstance.onplay();
  assert.strictEqual(onStartCalled, true, 'onStart should be called when audio plays');

  global.localStorage.removeItem('visiondx_elevenlabs_key');
  console.log('  [✓] Passed.')
}

async function testElevenLabsFailureFallbackToGoogle() {
  console.log('  Running Test: ElevenLabs Failure fallback to Google TTS...')
  global.localStorage.setItem('visiondx_elevenlabs_key', 'fail-key');
  global.fetchResponse = {
    ok: false,
    status: 500
  };

  await speakText('Hello Fallback', 'en-US');

  assert.ok(lastAudioInstance.src.includes('localhost:3001/api/tts'), 'Should fallback to Google TTS Proxy');
  assert.ok(lastAudioInstance.src.includes('text=Hello%20Fallback'), 'URL should contain correct text');

  global.localStorage.removeItem('visiondx_elevenlabs_key');
  global.fetchResponse = null;
  console.log('  [✓] Passed.')
}

async function testGoogleTTSChunking() {
  console.log('  Running Test: Google TTS Chunking...')
  // Create a string > 190 chars
  const longText = 'A'.repeat(100) + '. ' + 'B'.repeat(100) + '. ' + 'C'.repeat(100);
  // Expected chunks: "A"*100 + ".", "B"*100 + ".", "C"*100 + "."

  let endReached = false;
  speakText(longText, 'en-US', { onEnd: () => { endReached = true } });

  await new Promise(resolve => setTimeout(resolve, 0));

  assert.ok(lastAudioInstance.src.includes('text=' + 'A'.repeat(100)), 'First chunk should be played');

  // Simulate first chunk end
  const firstAudio = lastAudioInstance;
  if (firstAudio.onended) firstAudio.onended();

  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(lastAudioInstance.src.includes('text=' + 'B'.repeat(100)), 'Second chunk should be played');
  assert.notStrictEqual(lastAudioInstance, firstAudio, 'A new Audio instance should be created for the second chunk');

  // Simulate second chunk end
  if (lastAudioInstance.onended) lastAudioInstance.onended();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(lastAudioInstance.src.includes('text=' + 'C'.repeat(100)), 'Third chunk should be played');

  // Simulate final chunk end
  if (lastAudioInstance.onended) lastAudioInstance.onended();
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.strictEqual(endReached, true, 'onEnd should be called after all chunks');

  console.log('  [✓] Passed.')
}

async function testGoogleTTSFailureFallbackToNative() {
  console.log('  Running Test: Google TTS Failure fallback to Native...')
  lastUtterance = null;

  const promise = speakText('Native Fallback', 'en-US');
  await new Promise(resolve => setTimeout(resolve, 0));

  // Simulate Audio error
  if (lastAudioInstance.onerror) lastAudioInstance.onerror(new Error('Audio failed'));

  await new Promise(resolve => setTimeout(resolve, 0));
  assert.ok(lastUtterance, 'Native speech should be triggered');
  assert.strictEqual(lastUtterance.text, 'Native Fallback', 'Utterance should have correct text');

  console.log('  [✓] Passed.')
}

async function testCancelSpeech() {
  console.log('  Running Test: cancelSpeech...')
  // 1. Setup an active Audio
  await speakText('Cancel me', 'en-US');
  const activeAudio = lastAudioInstance;
  assert.strictEqual(activeAudio.paused, false, 'Audio should be playing');

  speechSynthesisCancelled = false;
  cancelSpeech();

  assert.strictEqual(activeAudio.paused, true, 'Audio should be paused');
  assert.strictEqual(speechSynthesisCancelled, true, 'SpeechSynthesis should be cancelled');
  console.log('  [✓] Passed.')
}

async function runTests() {
  try {
    await testEmptyText();
    await testTextSanitization();
    await testElevenLabsSuccess();
    await testElevenLabsFailureFallbackToGoogle();
    await testGoogleTTSChunking();
    await testGoogleTTSFailureFallbackToNative();
    await testCancelSpeech();

    console.log('\n🎉 ALL TTS SERVICE TESTS PASSED SUCCESSFULLY!')
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE DETECTED:')
    console.error(err)
    process.exit(1)
  }
}

runTests();
