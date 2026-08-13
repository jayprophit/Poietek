import type {BenchmarkMetric, StudioBenchmarkMetrics} from '../diagnostics';

declare global {
  interface ObjectConstructor {
    entries(value: StudioBenchmarkMetrics): Array<[string, BenchmarkMetric]>;
  }
}

export {};
