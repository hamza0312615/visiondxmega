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

// 2. Import Module
import {
  isDemoMode,
  setDemoMode,
  saveResult,
  getHistory,
  getHistoryByType,
  deleteEntry,
  clearHistory,
  getRiskLog,
  saveRiskLog,
  getHeatmapOptIn,
  setHeatmapOptIn,
  getHeatmapData,
  saveHeatmapEntry,
  clearHeatmapData,
  getWhatsAppConfig,
  setWhatsAppConfig,
  getDemoData
} from './src/utils/localStorage.js'

console.log('🧪 Starting VisionDX Mega Local Storage Utility Tests...')

try {
  // Test 1: Global Demo Mode Flags
  console.log('\n  Running Test 1: Global Demo Mode Flags...')
  assert.strictEqual(isDemoMode(), false, 'Demo mode should default to false')
  setDemoMode(true)
  assert.strictEqual(isDemoMode(), true, 'Demo mode should toggle to true')
  setDemoMode(false)
  assert.strictEqual(isDemoMode(), false, 'Demo mode should toggle back to false')
  console.log('  [✓] Test 1 Passed successfully.')

  // Test 2: History CRUD Operations
  console.log('\n  Running Test 2: History Operations...')
  clearHistory()
  assert.deepStrictEqual(getHistory(), [], 'History should be empty after clearHistory')
  
  const entry1 = saveResult('eye', { summary: 'Eye scan demo', details: { condition: 'Cataract' } })
  // Add tiny delay to ensure unique IDs if they use Date.now()
  await new Promise(r => setTimeout(r, 10))
  const entry2 = saveResult('skin', { summary: 'Skin scan demo', details: { condition: 'Eczema' } })
  
  const history = getHistory()
  assert.strictEqual(history.length, 2, 'History length should be 2')
  assert.strictEqual(history[0].type, 'skin', 'Latest entry should be at the front')
  assert.strictEqual(history[1].type, 'eye', 'Older entry should follow')

  const eyeHistory = getHistoryByType('eye')
  assert.strictEqual(eyeHistory.length, 1, 'Eye history length should be 1')
  assert.strictEqual(eyeHistory[0].details.condition, 'Cataract', 'Condition should match Cataract')

  deleteEntry(entry1.id)
  assert.strictEqual(getHistory().length, 1, 'History length should decrease after deletion')
  assert.strictEqual(getHistory()[0].type, 'skin', 'Remaining entry should be skin')
  console.log('  [✓] Test 2 Passed successfully.')

  // Test 3: Risk Log Operations
  console.log('\n  Running Test 3: Risk Log Tracker...')
  localStorage.removeItem('visiondx_riskLog')
  assert.deepStrictEqual(getRiskLog(), [], 'Risk log should start empty')
  
  saveRiskLog('NORMAL')
  saveRiskLog('EMERGENCY')
  saveRiskLog('SEE_DOCTOR')
  
  const riskLog = getRiskLog()
  assert.strictEqual(riskLog.length, 3, 'Risk log should contain 3 entries')
  assert.strictEqual(riskLog[0].score, 20, 'NORMAL risk score should be 20')
  assert.strictEqual(riskLog[1].score, 85, 'EMERGENCY risk score should be 85')
  assert.strictEqual(riskLog[2].score, 50, 'SEE_DOCTOR risk score should be 50')
  console.log('  [✓] Test 3 Passed successfully.')

  // Test 4: Heatmap Sharing Toggles & Disease Logging
  console.log('\n  Running Test 4: Epidemiological Heatmap Tracker...')
  clearHeatmapData()
  setHeatmapOptIn(false)
  assert.strictEqual(getHeatmapOptIn(), false, 'Heatmap opt-in should default to false')
  
  // Try saving entry while opted out - should not record
  saveHeatmapEntry('Karachi', 'Conjunctivitis')
  assert.deepStrictEqual(getHeatmapData(), [], 'Heatmap logs should remain empty when opted out')
  
  setHeatmapOptIn(true)
  assert.strictEqual(getHeatmapOptIn(), true, 'Heatmap opt-in should enable successfully')
  
  saveHeatmapEntry('Karachi', 'Conjunctivitis')
  saveHeatmapEntry('Lahore', 'Eczema')
  
  const heatmapData = getHeatmapData()
  assert.strictEqual(heatmapData.length, 2, 'Heatmap logs should contain 2 entries')
  assert.strictEqual(heatmapData[0].city, 'Karachi', 'First entry city should match Karachi')
  assert.strictEqual(heatmapData[1].city, 'Lahore', 'Second entry city should match Lahore')
  
  clearHeatmapData()
  assert.deepStrictEqual(getHeatmapData(), [], 'Heatmap logs should be cleared successfully')
  console.log('  [✓] Test 4 Passed successfully.')

  // Test 5: WhatsApp Routing Configurations
  console.log('\n  Running Test 5: WhatsApp Router Configuration...')
  localStorage.removeItem('visiondx_whatsapp_config')
  const defaultWA = getWhatsAppConfig()
  assert.strictEqual(defaultWA.doctorPhone, '923001234567', 'Doctor phone default should be pakistani placeholder')
  
  setWhatsAppConfig({ doctorPhone: '923009999999' })
  const updatedWA = getWhatsAppConfig()
  assert.strictEqual(updatedWA.doctorPhone, '923009999999', 'Doctor phone should update correctly')
  console.log('  [✓] Test 5 Passed successfully.')

  // Test 6: Clinic-Grade Mock Preloaders
  console.log('\n  Running Test 6: Demo Mock Preloaders...')
  const eyeMock = getDemoData('eye')
  assert.ok(eyeMock.base64, 'Eye mock should contain base64 imagery')
  assert.ok(eyeMock.symptoms.includes('Conjunctivitis'), 'Eye mock symptoms should refer to conjunctivitis')

  const sleepMock = getDemoData('sleep')
  assert.strictEqual(sleepMock.snoring, 'Yes - Heavy', 'Sleep mock should record heavy snoring')
  assert.strictEqual(sleepMock.fatigue, 'Severe', 'Sleep mock should record severe morning fatigue')

  const routineMock = getDemoData('routine')
  assert.strictEqual(routineMock.screenTime, '9', 'Routine mock should record screen exposure')
  assert.strictEqual(routineMock.stress, 'High', 'Routine mock should record cortisol stress')
  console.log('  [✓] Test 6 Passed successfully.')

  console.log('\n🎉 ALL 6 STATE ENGINE TESTS PASSED SUCCESSFULLY! THE STATE MACHINE MATCHES SPECIFICATIONS.')
} catch (err) {
  console.error('\n❌ TEST SUITE FAILURE DETECTED:')
  console.error(err)
  process.exit(1)
}
