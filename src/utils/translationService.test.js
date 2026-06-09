import assert from 'assert';
import { translateText } from './translationService.js';

// 1. Mock Fetch
let mockFetchResponses = [];
global.fetch = async (url, options) => {
  const response = mockFetchResponses.shift();
  if (!response) {
    throw new Error('No mock response provided for fetch');
  }
  return {
    ok: response.ok ?? true,
    status: response.status ?? 200,
    json: async () => response.data
  };
};

// 2. Mock console.warn to keep test output clean
const originalWarn = console.warn;
console.warn = () => {};

async function runTests() {
  console.log('🧪 Starting translationService Utility Tests...');

  try {
    // Test 1: Empty or whitespace text returns empty string
    console.log('\n  Running Test 1: Empty Input Handling...');
    assert.strictEqual(await translateText(''), '', 'Empty string should return empty string');
    assert.strictEqual(await translateText('   '), '', 'Whitespace string should return empty string');
    assert.strictEqual(await translateText(null), '', 'Null should return empty string');
    console.log('  [✓] Test 1 Passed.');

    // Test 2: Same language translation returns original text
    console.log('\n  Running Test 2: Same Language Check...');
    assert.strictEqual(await translateText('Hello', 'en', 'en'), 'Hello', 'Same lang en->en');
    assert.strictEqual(await translateText('Hello', 'en-US', 'en'), 'Hello', 'Mapped lang en-US->en');
    assert.strictEqual(await translateText('سلام', 'ur', 'ur-PK'), 'سلام', 'Mapped lang ur->ur-PK');
    console.log('  [✓] Test 2 Passed.');

    // Test 3: MyMemory API Success (Primary)
    console.log('\n  Running Test 3: MyMemory API Success...');
    mockFetchResponses = [
      {
        data: { responseData: { translatedText: 'Hello (translated)' } }
      }
    ];
    const res3 = await translateText('Hello', 'ur', 'en');
    assert.strictEqual(res3, 'Hello (translated)', 'Should return translated text from MyMemory');
    console.log('  [✓] Test 3 Passed.');

    // Test 4: MyMemory Fails (HTTP Error), LibreTranslate Success
    console.log('\n  Running Test 4: MyMemory Failover (HTTP Error)...');
    mockFetchResponses = [
      { ok: false, status: 500 }, // MyMemory
      { data: { translatedText: 'Hello (fallback)' } } // LibreTranslate
    ];
    const res4 = await translateText('Hello', 'ur', 'en');
    assert.strictEqual(res4, 'Hello (fallback)', 'Should fallback to LibreTranslate on MyMemory HTTP error');
    console.log('  [✓] Test 4 Passed.');

    // Test 5: MyMemory Fails (Missing Data), LibreTranslate Success
    console.log('\n  Running Test 5: MyMemory Failover (Missing Data)...');
    mockFetchResponses = [
      { data: { responseData: {} } }, // MyMemory missing translatedText
      { data: { translatedText: 'Hello (fallback 2)' } } // LibreTranslate
    ];
    const res5 = await translateText('Hello', 'ur', 'en');
    assert.strictEqual(res5, 'Hello (fallback 2)', 'Should fallback to LibreTranslate on MyMemory invalid data');
    console.log('  [✓] Test 5 Passed.');

    // Test 6: Both APIs Fail
    console.log('\n  Running Test 6: Both APIs Fail...');
    mockFetchResponses = [
      { ok: false, status: 404 }, // MyMemory
      { ok: false, status: 404 }  // LibreTranslate
    ];
    const res6 = await translateText('Hello', 'ur', 'en');
    assert.strictEqual(res6, null, 'Should return null when both APIs fail');
    console.log('  [✓] Test 6 Passed.');

    console.log('\n🎉 ALL TRANSLATION SERVICE TESTS PASSED!');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILURE DETECTED:');
    console.error(err);
    process.exit(1);
  } finally {
    console.warn = originalWarn;
  }
}

runTests();
