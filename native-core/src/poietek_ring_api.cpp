#include "poietek/poietek_ring.h"
#include "poietek/spsc_ringbuffer.h"

#include <cstddef>
#include <new>

struct RingHandle {
  poietek::SpscRingBuffer<float>* buf;
};

extern "C" poietek_ring_t poietek_ring_create(unsigned int capacity_pow2) {
  if (capacity_pow2 < 2) return nullptr;
  // capacity_pow2 must be power of two; validate
  if ((capacity_pow2 & (capacity_pow2 - 1)) != 0) return nullptr;
  RingHandle* h = nullptr;
  try {
    h = new RingHandle();
    h->buf = new poietek::SpscRingBuffer<float>();
    if (!h->buf->init(static_cast<size_t>(capacity_pow2))) {
      delete h->buf; h->buf = nullptr; delete h; return nullptr;
    }
  } catch (const std::bad_alloc&) {
    delete h;
    return nullptr;
  }
  return reinterpret_cast<poietek_ring_t>(h);
}

extern "C" void poietek_ring_free(poietek_ring_t ring) {
  if (!ring) return;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  delete h->buf;
  h->buf = nullptr;
  delete h;
}

extern "C" int poietek_ring_push_f32(poietek_ring_t ring, float value) {
  if (!ring) return 0;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  bool ok = h->buf->push(value);
  return ok ? 1 : 0;
}

extern "C" int poietek_ring_pop_f32(poietek_ring_t ring, float* out) {
  if (!ring || !out) return 0;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  float tmp = 0.0f;
  bool ok = h->buf->pop(tmp);
  if (ok) *out = tmp;
  return ok ? 1 : 0;
}

extern "C" unsigned int poietek_ring_capacity(poietek_ring_t ring) {
  if (!ring) return 0;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  return static_cast<unsigned int>(h->buf->capacity());
}

extern "C" unsigned int poietek_ring_size(poietek_ring_t ring) {
  if (!ring) return 0;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  return static_cast<unsigned int>(h->buf->size());
}

extern "C" unsigned int poietek_ring_push_bulk_f32(poietek_ring_t ring, const float* data, unsigned int count) {
  if (!ring || !data || count == 0) return 0;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  unsigned int pushed = 0;
  for (unsigned int i = 0; i < count; ++i) {
    if (!h->buf->push(data[i])) break;
    pushed++;
  }
  return pushed;
}

extern "C" unsigned int poietek_ring_pop_bulk_f32(poietek_ring_t ring, float* out, unsigned int count) {
  if (!ring || !out || count == 0) return 0;
  RingHandle* h = reinterpret_cast<RingHandle*>(ring);
  unsigned int popped = 0;
  for (unsigned int i = 0; i < count; ++i) {
    float tmp = 0.0f;
    if (!h->buf->pop(tmp)) break;
    out[i] = tmp;
    popped++;
  }
  return popped;
}
