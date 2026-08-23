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
