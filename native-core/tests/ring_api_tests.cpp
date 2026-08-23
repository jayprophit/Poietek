#include "poietek/poietek_ring.h"
#include <cassert>
#include <iostream>

int main() {
  unsigned int cap = 16;
  auto ring = poietek_ring_create(cap);
  assert(ring != nullptr);
  assert(poietek_ring_capacity(ring) >= cap);

  // push values
  for (int i = 0; i < 10; ++i) {
    int ok = poietek_ring_push_f32(ring, (float)i + 0.5f);
    assert(ok == 1);
  }

  // pop and verify
  for (int i = 0; i < 10; ++i) {
    float v = 0.0f;
    int ok = poietek_ring_pop_f32(ring, &v);
    assert(ok == 1);
    assert(v == (float)i + 0.5f);
  }

  // empty now
  float out;
  assert(poietek_ring_pop_f32(ring, &out) == 0);

  poietek_ring_free(ring);
  std::cout << "ring_api_tests passed\n";
  return 0;
}
