const diseaseData = {
  skin: {}
};

for (let i = 0; i < 10000; i++) {
  diseaseData.skin[`Condition${i}`] = { description: `Description ${i}` };
}
diseaseData.skin[`TargetCondition`] = { description: `Target Description` };

const aiResponse = "This is a response containing targetCondition and some other text. ".repeat(100);

function runBaseline() {
  const skinConditions = diseaseData.skin || {}
  let matchedCondition = null
  let matchedKey = ''

  for (const [key, data] of Object.entries(skinConditions)) {
    if (aiResponse.toLowerCase().includes(key.toLowerCase())) {
      matchedCondition = data
      matchedKey = key
      break
    }
  }
}

function runOptimized() {
  const skinConditions = diseaseData.skin || {}
  let matchedCondition = null
  let matchedKey = ''
  const lowerAiResponse = aiResponse.toLowerCase()

  for (const [key, data] of Object.entries(skinConditions)) {
    if (lowerAiResponse.includes(key.toLowerCase())) {
      matchedCondition = data
      matchedKey = key
      break
    }
  }
}

const ITERATIONS = 1000;

// Warmup
for (let i = 0; i < 100; i++) {
  runBaseline();
  runOptimized();
}

const startBaseline = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  runBaseline();
}
const endBaseline = performance.now();

const startOptimized = performance.now();
for (let i = 0; i < ITERATIONS; i++) {
  runOptimized();
}
const endOptimized = performance.now();

console.log(`Baseline: ${endBaseline - startBaseline} ms`);
console.log(`Optimized: ${endOptimized - startOptimized} ms`);
console.log(`Improvement: ${(((endBaseline - startBaseline) - (endOptimized - startOptimized)) / (endBaseline - startBaseline) * 100).toFixed(2)}%`);
