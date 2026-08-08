import { performance } from 'perf_hooks';

const details = {};
for (let i = 0; i < 1000; i++) {
  details[`camelCaseKey${i}WithSeveralCapitalLetters`] = `Value ${i}`;
}

const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').trim();

// Baseline: Formatting on every render
function renderBaseline() {
  const start = performance.now();
  for (let render = 0; render < 1000; render++) {
    Object.entries(details).map(([key, val]) => ({
      key,
      label: formatKey(key),
      val
    }));
  }
  const end = performance.now();
  return end - start;
}

// Optimized: Memoized formatting
function renderOptimized() {
  const start = performance.now();
  // memoized once
  const memoizedDetails = Object.entries(details).map(([key, val]) => ({
    key,
    label: formatKey(key),
    val
  }));
  for (let render = 0; render < 1000; render++) {
    const renderResult = memoizedDetails; // in React this is just using the memoized array
  }
  const end = performance.now();
  return end - start;
}

const baseTime = renderBaseline();
const optTime = renderOptimized();
console.log(`Baseline time: ${baseTime.toFixed(2)} ms`);
console.log(`Optimized time: ${optTime.toFixed(2)} ms`);
console.log(`Improvement: ${((baseTime - optTime) / baseTime * 100).toFixed(2)}%`);
