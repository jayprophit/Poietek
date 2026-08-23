#include "poietek/poietek_ring.h"
#include <cassert>
#include <vector>
#include <iostream>

int main() {
  // create ring with capacity 16
  auto ring = poietek_ring_create(16);
  assert(ring != nullptr);

  std::vector<float> src(8);
  for (int i = 0; i < 8; ++i) src[i] = float(i) + 0.25f;

  unsigned int pushed = poietek_ring_push_bulk_f32(ring, src.data(), (unsigned int)src.size());
  if (pushed != src.size()) {
    std::cerr << "Expected to push " << src.size() << " but pushed " << pushed << "\n";
    return 1;
  }

  std::vector<float> dst(8, 0.0f);
  unsigned int popped = poietek_ring_pop_bulk_f32(ring, dst.data(), (unsigned int)dst.size());
  if (popped != dst.size()) {
    std::cerr << "Expected to pop " << dst.size() << " but popped " << popped << "\n";
    return 2;
  }

  for (size_t i = 0; i < dst.size(); ++i) {
    if (dst[i] != src[i]) {
      std::cerr << "Mismatch at " << i << ": " << dst[i] << " != " << src[i] << "\n";
      return 3;
    }
  }

  poietek_ring_free(ring);
  std::cout << "ring_bulk_tests: OK\n";
  return 0;
}
