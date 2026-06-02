const { performance } = require('perf_hooks');

const aiResponse = "This is a very long text representing an AI response that might contain some specific keywords like Conjunctivitis, Glaucoma, Cataract, or perhaps Macular Degeneration. ".repeat(100) + "Glaucoma is detected.";

const eyeConditions = {};
for (let i = 0; i < 10000; i++) {
  eyeConditions[`Condition${i}`] = { data: i };
}
eyeConditions['Glaucoma'] = { data: 'glaucoma' };

function original() {
  let matchedCondition = null;
  let matchedKey = '';

  const start = performance.now();
  for (const [key, data] of Object.entries(eyeConditions)) {
    if (aiResponse.toLowerCase().includes(key.toLowerCase())) {
      matchedCondition = data;
      matchedKey = key;
      break;
    }
  }
  const end = performance.now();
  return { time: end - start, matchedKey };
}

function optimized() {
  let matchedCondition = null;
  let matchedKey = '';

  const start = performance.now();
  const aiResponseLower = aiResponse.toLowerCase();
  for (const [key, data] of Object.entries(eyeConditions)) {
    if (aiResponseLower.includes(key.toLowerCase())) {
      matchedCondition = data;
      matchedKey = key;
      break;
    }
  }
  const end = performance.now();
  return { time: end - start, matchedKey };
}

// Warmup
for(let i=0; i<10; i++) {
  original();
  optimized();
}

let origTotal = 0;
let optTotal = 0;
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  origTotal += original().time;
  optTotal += optimized().time;
}

console.log(`Original average: ${origTotal / iterations} ms`);
console.log(`Optimized average: ${optTotal / iterations} ms`);
console.log(`Improvement: ${((origTotal - optTotal) / origTotal * 100).toFixed(2)}%`);
