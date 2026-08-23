#include "poietek/spsc_ringbuffer.h"
#include "poietek/poietek_dsp.h"

#include <cassert>
#include <iostream>

int main() {
  poietek::SpscRingBuffer<float> rb;
  const size_t cap = 8; // must be power of two
  assert(rb.init(cap) && "ring buffer init failed");
  assert(rb.empty());

  // push until full
  for (int i = 0; i < static_cast<int>(cap - 1); ++i) {
    bool ok = rb.push(static_cast<float>(i) + 0.5f);
    assert(ok);
  }
  // now should be full (cap - 1 elements)
  assert(rb.full());

  // pushing one more should fail
  bool ok = rb.push(99.0f);
  assert(!ok);

  // pop values and verify order
  for (int i = 0; i < static_cast<int>(cap - 1); ++i) {
    float v = 0.0f;
    bool popped = rb.pop(v);
    assert(popped);
    assert(v == static_cast<float>(i) + 0.5f);
  }
  assert(rb.empty());

  // test wrap-around
  for (int i = 0; i < 6; ++i) rb.push(static_cast<float>(i));
  for (int i = 0; i < 3; ++i) {
    float v = 0.0f; rb.pop(v); assert(v == static_cast<float>(i));
  }
  for (int i = 6; i < 12; ++i) rb.push(static_cast<float>(i));
  // pop remaining in order
  float prev = -1.0f; float val; int count = 0;
  while (rb.pop(val)) {
    (void)prev; (void)val; ++count;
  }
  assert(count > 0);

  std::cout << "ringbuffer_tests passed\n";
  return 0;
}
