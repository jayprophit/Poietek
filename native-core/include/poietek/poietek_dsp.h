#ifndef POIETEK_DSP_H
#define POIETEK_DSP_H

#include <stdint.h>

#if defined(_WIN32) && defined(POIETEK_DSP_SHARED)
#if defined(POIETEK_DSP_BUILD)
#define POIETEK_DSP_API __declspec(dllexport)
#else
#define POIETEK_DSP_API __declspec(dllimport)
#endif
#else
#define POIETEK_DSP_API
#endif

#ifdef __cplusplus
extern "C" {
#endif

#define POIETEK_DSP_ABI_VERSION 1u

typedef enum poietek_dsp_result {
  POIETEK_DSP_OK = 0,
  POIETEK_DSP_INVALID_ARGUMENT = 1,
  POIETEK_DSP_UNSUPPORTED_ABI = 2,
  POIETEK_DSP_UNSUPPORTED_CHANNEL_COUNT = 3
} poietek_dsp_result;

typedef struct poietek_dsp_process_config {
  uint32_t abi_version;
  uint32_t frame_count;
  uint32_t channel_count;
  float gain_linear;
  float pan;
} poietek_dsp_process_config;

typedef struct poietek_dsp_telemetry {
  uint64_t processed_frames;
  uint64_t clipped_samples;
  float peak_absolute;
} poietek_dsp_telemetry;

POIETEK_DSP_API uint32_t poietek_dsp_abi_version(void);

POIETEK_DSP_API poietek_dsp_result poietek_dsp_process_interleaved_f32(
  const poietek_dsp_process_config* config,
  const float* input,
  float* output,
  poietek_dsp_telemetry* telemetry
);

// Warmup helper: runs a simple processing loop on synthesized input to allow
// runtime caches and buffers to be allocated. Parameters are frames per buffer,
// channels and number of iterations. telemetry is filled in with aggregate info.
POIETEK_DSP_API poietek_dsp_result poietek_dsp_warmup(
  uint32_t frames,
  uint32_t channels,
  uint32_t iterations,
  poietek_dsp_telemetry* telemetry
);

#ifdef __cplusplus
}
#endif

#endif
