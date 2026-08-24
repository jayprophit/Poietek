#include "poietek/poietek_dsp.h"

#include <chrono>
#include <iostream>
#include <vector>

int main() {
  const unsigned frames = 48000U;
  const unsigned channels = 2U;
  std::vector<float> input(frames * channels, 0.0f);
  std::vector<float> output(frames * channels, 0.0f);

  // Fill with a simple test signal
  for (unsigned i = 0; i < frames; ++i) {
    input[i * channels + 0] = 0.25f * std::sin(2.0f * 3.14159265f * (float)i / 441.0f);
    input[i * channels + 1] = input[i * channels + 0];
  }

  poietek_dsp_process_config config{POIETEK_DSP_ABI_VERSION, frames, channels, 1.0f, 0.0f};
  poietek_dsp_telemetry telemetry{};

  const int iterations = 50;
  auto t0 = std::chrono::high_resolution_clock::now();
  for (int it = 0; it < iterations; ++it) {
    auto ret = poietek_dsp_process_interleaved_f32(&config, input.data(), output.data(), &telemetry);
    if (ret != POIETEK_DSP_OK) {
      std::cerr << "Processing failed: " << ret << "\n";
      return 2;
    }
  }
  auto t1 = std::chrono::high_resolution_clock::now();
  auto dur = std::chrono::duration_cast<std::chrono::milliseconds>(t1 - t0).count();
  double ms_per_iter = double(dur) / iterations;
  double samples_processed = double(frames) * iterations;
  double samples_per_sec = (samples_processed / (double)dur) * 1000.0;

  std::cout << "benchmark: iterations=" << iterations << " total_ms=" << dur << " ms_per_iter=" << ms_per_iter
            << " samples_per_sec=" << samples_per_sec << "\n";
  std::cout << "telemetry: processed_frames=" << telemetry.processed_frames << " clipped_samples=" << telemetry.clipped_samples
            << " peak_absolute=" << telemetry.peak_absolute << "\n";
  return 0;
}
