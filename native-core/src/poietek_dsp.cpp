#include "poietek/poietek_dsp.h"

#include <algorithm>
#include <cmath>
#include <cstddef>

namespace {

constexpr float kSilentDenormalThreshold = 1.0e-30F;

float sanitize_sample(const float sample) noexcept {
  if (!std::isfinite(sample) || std::abs(sample) < kSilentDenormalThreshold) {
    return 0.0F;
  }
  return sample;
}

void observe_sample(const float sample, poietek_dsp_telemetry& telemetry) noexcept {
  const float absolute = std::abs(sample);
  telemetry.peak_absolute = std::max(telemetry.peak_absolute, absolute);
  if (absolute > 1.0F) {
    ++telemetry.clipped_samples;
  }
}

}  // namespace

extern "C" uint32_t poietek_dsp_abi_version(void) {
  return POIETEK_DSP_ABI_VERSION;
}

extern "C" poietek_dsp_result poietek_dsp_process_interleaved_f32(
  const poietek_dsp_process_config* config,
  const float* input,
  float* output,
  poietek_dsp_telemetry* telemetry
) {
  if (config == nullptr || input == nullptr || output == nullptr || telemetry == nullptr) {
    return POIETEK_DSP_INVALID_ARGUMENT;
  }
  if (config->abi_version != POIETEK_DSP_ABI_VERSION) {
    return POIETEK_DSP_UNSUPPORTED_ABI;
  }
  if (config->channel_count == 0U || config->channel_count > 64U || !std::isfinite(config->gain_linear)
      || !std::isfinite(config->pan) || config->gain_linear < 0.0F || config->pan < -1.0F || config->pan > 1.0F) {
    return POIETEK_DSP_INVALID_ARGUMENT;
  }

  telemetry->processed_frames = 0U;
  telemetry->clipped_samples = 0U;
  telemetry->peak_absolute = 0.0F;

  const float pan_angle = (config->pan + 1.0F) * 0.7853981633974483F;
  const float left_gain = config->channel_count == 2U ? std::cos(pan_angle) * config->gain_linear : config->gain_linear;
  const float right_gain = config->channel_count == 2U ? std::sin(pan_angle) * config->gain_linear : config->gain_linear;

  for (uint32_t frame = 0U; frame < config->frame_count; ++frame) {
    const std::size_t frame_offset = static_cast<std::size_t>(frame) * config->channel_count;
    for (uint32_t channel = 0U; channel < config->channel_count; ++channel) {
      const float channel_gain = channel == 0U ? left_gain : channel == 1U ? right_gain : config->gain_linear;
      const float processed = sanitize_sample(input[frame_offset + channel]) * channel_gain;
      output[frame_offset + channel] = processed;
      observe_sample(processed, *telemetry);
    }
    ++telemetry->processed_frames;
  }

  return POIETEK_DSP_OK;
}

#include "poietek/spsc_ringbuffer.h"

extern "C" poietek_dsp_result poietek_dsp_warmup(
  uint32_t frames,
  uint32_t channels,
  uint32_t iterations,
  poietek_dsp_telemetry* telemetry
) {
  if (frames == 0 || channels == 0 || telemetry == nullptr) return POIETEK_DSP_INVALID_ARGUMENT;
  const std::size_t size = static_cast<std::size_t>(frames) * channels;

  // Static preallocated buffers and ring buffer to avoid allocations in the hot loop.
  static float* input_buf = nullptr;
  static float* output_buf = nullptr;
  static std::size_t allocated_size = 0;
  static poietek::SpscRingBuffer<float>* ring = nullptr;
  static bool ring_initialized = false;

  if (allocated_size != size) {
    // (Re)allocate backing buffers once. This uses heap but only on size change.
    delete[] input_buf; input_buf = nullptr;
    delete[] output_buf; output_buf = nullptr;
    input_buf = new (std::nothrow) float[size];
    output_buf = new (std::nothrow) float[size];
    if (!input_buf || !output_buf) {
      delete[] input_buf; delete[] output_buf;
      input_buf = output_buf = nullptr;
      allocated_size = 0;
      return POIETEK_DSP_INVALID_ARGUMENT;
    }
    allocated_size = size;

    // Initialize or re-init ring buffer to a power-of-two capacity >= size*2.
    if (!ring) ring = new (std::nothrow) poietek::SpscRingBuffer<float>();
    if (!ring) {
      return POIETEK_DSP_INVALID_ARGUMENT;
    }
    // compute capacity power of two
    std::size_t cap = 1;
    while (cap < size * 2) cap <<= 1;
    ring_initialized = ring->init(cap);
  }

  // Fill input buffer once with a test tone
  for (uint32_t i = 0; i < frames; ++i) {
    const float v = 0.25F * std::sin(2.0F * 3.14159265358979323846F * static_cast<float>(i) / 441.0F);
    for (uint32_t c = 0; c < channels; ++c) input_buf[static_cast<std::size_t>(i) * channels + c] = v;
  }

  poietek_dsp_process_config config{POIETEK_DSP_ABI_VERSION, frames, channels, 1.0F, 0.0F};
  telemetry->processed_frames = 0U;
  telemetry->clipped_samples = 0U;
  telemetry->peak_absolute = 0.0F;

  if (ring_initialized && ring) {
    // Push the buffer into the ring, then pop into a contiguous buffer for processing.
    // This exercise avoids allocations during the loop.
    for (uint32_t it = 0; it < iterations; ++it) {
      // push entire block
      for (std::size_t i = 0; i < size; ++i) {
        // wait-free push: if ring is full (shouldn't happen due to sizing) break
        if (!ring->push(input_buf[i])) {
          // consumer might be lagging; break to avoid busy spin
          break;
        }
      }
      // pop into output_buf
      std::size_t idx = 0;
      float tmp = 0.0f;
      while (idx < size && ring->pop(tmp)) {
        input_buf[idx] = tmp; // reuse input_buf slot for contiguous input
        ++idx;
      }
      // If we popped fewer than expected, fill remainder with 0
      for (; idx < size; ++idx) input_buf[idx] = 0.0f;

      auto res = poietek_dsp_process_interleaved_f32(&config, input_buf, output_buf, telemetry);
      if (res != POIETEK_DSP_OK) return res;
    }
  } else {
    // Fallback: non-ring warmup using preallocated buffers to avoid allocations in loop
    for (uint32_t it = 0; it < iterations; ++it) {
      auto res = poietek_dsp_process_interleaved_f32(&config, input_buf, output_buf, telemetry);
      if (res != POIETEK_DSP_OK) return res;
    }
  }

  return POIETEK_DSP_OK;
}
