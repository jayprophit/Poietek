import fs from 'fs';
import path from 'path';

const benchPath = process.argv[2] || 'native-core/build/bench-output.txt';
const baselinePath = process.argv[3] || '.github/bench/baseline.json';

function parseBench(file) {
  if (!fs.existsSync(file)) return null;
  const txt = fs.readFileSync(file, 'utf8');
  // naive parse: look for 'ms_per_iter' or 'samples_per_sec' patterns
  const msMatch = txt.match(/ms_per_iter=\s*([0-9.]+)/i);
  const spMatch = txt.match(/samples_per_sec=\s*([0-9.]+)/i);
  const totalMs = (txt.match(/total_ms=\s*([0-9.]+)/i) || [])[1];
  return {
    raw: txt,
    ms_per_iter: msMatch ? parseFloat(msMatch[1]) : null,
    samples_per_sec: spMatch ? parseFloat(spMatch[1]) : null,
    total_ms: totalMs ? parseFloat(totalMs) : null,
  };
}

const bench = parseBench(benchPath);
const baseline = fs.existsSync(baselinePath) ? JSON.parse(fs.readFileSync(baselinePath, 'utf8')) : null;

if (!bench) {
  console.log('No bench output found at', benchPath);
  process.exit(0);
}

console.log('Bench summary:', {ms_per_iter: bench.ms_per_iter, samples_per_sec: bench.samples_per_sec});

if (baseline && baseline.samples_per_sec && bench.samples_per_sec) {
  const pct = ((bench.samples_per_sec - baseline.samples_per_sec) / baseline.samples_per_sec) * 100.0;
  console.log(`Performance change vs baseline: ${pct.toFixed(2)}%`);
} else if (baseline && baseline.ms_per_iter && bench.ms_per_iter) {
  const pct = ((bench.ms_per_iter - baseline.ms_per_iter) / baseline.ms_per_iter) * 100.0;
  console.log(`MS per iter change vs baseline: ${pct.toFixed(2)}%`);
} else {
  console.log('No numeric baseline available for comparison.');
}

// write a JSON summary for CI artifacts
const summary = {bench: bench, baseline: baseline || null};
fs.writeFileSync('bench-summary.json', JSON.stringify(summary, null, 2));
console.log('Wrote bench-summary.json');
