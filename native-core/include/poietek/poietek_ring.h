#ifndef POIETEK_RING_H
#define POIETEK_RING_H

#include "poietek_dsp.h"

#ifdef __cplusplus
extern "C" {
#endif

// Opaque ring buffer handle
typedef void* poietek_ring_t;

// Create a ring buffer with capacity equal to the provided power-of-two value.
// Returns NULL on failure. Capacity must be power-of-two and > 1.
POIETEK_DSP_API poietek_ring_t poietek_ring_create(unsigned int capacity_pow2);

// Free a ring buffer created with poietek_ring_create.
POIETEK_DSP_API void poietek_ring_free(poietek_ring_t ring);

// Push a float value into the ring. Returns 1 on success, 0 if full or error.
POIETEK_DSP_API int poietek_ring_push_f32(poietek_ring_t ring, float value);

// Pop a float value from the ring. Returns 1 on success and writes value to out,
// returns 0 if empty or error.
POIETEK_DSP_API int poietek_ring_pop_f32(poietek_ring_t ring, float* out);

// Bulk push/pop helpers. These attempt to push/pop up to `count` values
// and return the number of elements actually transferred.
POIETEK_DSP_API unsigned int poietek_ring_push_bulk_f32(poietek_ring_t ring, const float* data, unsigned int count);
POIETEK_DSP_API unsigned int poietek_ring_pop_bulk_f32(poietek_ring_t ring, float* out, unsigned int count);

// Query capacity and approximate size
POIETEK_DSP_API unsigned int poietek_ring_capacity(poietek_ring_t ring);
POIETEK_DSP_API unsigned int poietek_ring_size(poietek_ring_t ring);

#ifdef __cplusplus
}
#endif

#endif // POIETEK_RING_H
