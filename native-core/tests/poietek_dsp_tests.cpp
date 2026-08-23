#include "poietek/poietek_dsp.h"

#include <array>
#include <cassert>
#include <cmath>
#include <limits>

namespace {

bool approximately_equal(const float left, const float right, const float tolerance = 1.0e-5F) {
  return std::abs(left - right) <= tolerance;
}

void test_abi_and_argument_validation() {
  assert(poietek_dsp_abi_version() == POIETEK_DSP_ABI_VERSION);
  assert(poietek_dsp_process_interleaved_f32(nullptr, nullptr, nullptr, nullptr)
         == POIETEK_DSP_INVALID_ARGUMENT);

  poietek_dsp_process_config config{999U, 1U, 1U, 1.0F, 0.0F};
  float sample = 0.0F;
  poietek_dsp_telemetry telemetry{};
  assert(poietek_dsp_process_interleaved_f32(&config, &sample, &sample, &telemetry)
         == POIETEK_DSP_UNSUPPORTED_ABI);
}

void test_mono_gain_and_telemetry() {
  const std::array<float, 4> input{0.5F, -0.5F, 0.75F, -0.75F};
  std::array<float, input.size()> output{};
  poietek_dsp_process_config config{POIETEK_DSP_ABI_VERSION, 4U, 1U, 2.0F, 0.0F};
  poietek_dsp_telemetry telemetry{};

  assert(poietek_dsp_process_interleaved_f32(&config, input.data(), output.data(), &telemetry)
         == POIETEK_DSP_OK);
  assert(approximately_equal(output[0], 1.0F));
  assert(approximately_equal(output[1], -1.0F));
  assert(approximately_equal(output[2], 1.5F));
  assert(approximately_equal(output[3], -1.5F));
  assert(telemetry.processed_frames == 4U);
  assert(telemetry.clipped_samples == 2U);
  assert(approximately_equal(telemetry.peak_absolute, 1.5F));
}

void test_stereo_equal_power_pan() {
  const std::array<float, 2> input{1.0F, 1.0F};
  std::array<float, input.size()> output{};
  poietek_dsp_process_config config{POIETEK_DSP_ABI_VERSION, 1U, 2U, 1.0F, 0.0F};
  poietek_dsp_telemetry telemetry{};

  assert(poietek_dsp_process_interleaved_f32(&config, input.data(), output.data(), &telemetry)
         == POIETEK_DSP_OK);
  assert(approximately_equal(output[0], 0.70710678F));
  assert(approximately_equal(output[1], 0.70710678F));
}

void test_non_finite_input_is_silenced() {
  const std::array<float, 2> input{std::numeric_limits<float>::quiet_NaN(), std::numeric_limits<float>::infinity()};
  std::array<float, input.size()> output{1.0F, 1.0F};
  poietek_dsp_process_config config{POIETEK_DSP_ABI_VERSION, 2U, 1U, 1.0F, 0.0F};
  poietek_dsp_telemetry telemetry{};

  assert(poietek_dsp_process_interleaved_f32(&config, input.data(), output.data(), &telemetry)
         == POIETEK_DSP_OK);
  assert(output[0] == 0.0F);
  assert(output[1] == 0.0F);
  assert(telemetry.peak_absolute == 0.0F);
}

}  // namespace

int main() {
  test_abi_and_argument_validation();
  test_mono_gain_and_telemetry();
  test_stereo_equal_power_pan();
  test_non_finite_input_is_silenced();
  return 0;
}
