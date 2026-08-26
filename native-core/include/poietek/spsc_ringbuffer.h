#ifndef POIETEK_SPSC_RINGBUFFER_H
#define POIETEK_SPSC_RINGBUFFER_H

#include <atomic>
#include <cstddef>
#include <cstdint>
#include <new>
#include <utility>

namespace poietek {

// Single-producer single-consumer lock-free ring buffer.
// Designed for real-time audio use: once init() has been called, push() and pop()
// do not perform any heap allocations and only use atomic operations.
// Capacity must be a power of two.
template<typename T>
class SpscRingBuffer {
public:
  SpscRingBuffer() noexcept
    : buffer_(nullptr), capacity_(0), mask_(0), head_(0), tail_(0) {}

  ~SpscRingBuffer() {
    if (buffer_) delete[] buffer_;
  }

  // Initialize the ring buffer with a capacity (power-of-two). Returns false if
  // allocation failed or capacity not power-of-two.
  bool init(size_t capacity) noexcept {
    if (capacity == 0) return false;
    // round up to nearest power of two if necessary
    if ((capacity & (capacity - 1)) != 0) {
      // not a power of two
      return false;
    }
    try {
      buffer_ = new T[capacity];
    } catch (const std::bad_alloc&) {
      buffer_ = nullptr;
      return false;
    }
    capacity_ = capacity;
    mask_ = capacity - 1;
    head_.store(0, std::memory_order_relaxed);
    tail_.store(0, std::memory_order_relaxed);
    return true;
  }

  // Push an item onto the ring buffer. Returns true on success, false if full.
  bool push(const T& item) noexcept {
    const uint32_t head = head_.load(std::memory_order_relaxed);
    const uint32_t tail = tail_.load(std::memory_order_acquire);
    if (((head + 1) & mask_) == (tail & mask_)) {
      // full
      return false;
    }
    buffer_[head & mask_] = item;
    head_.store(head + 1, std::memory_order_release);
    return true;
  }

  // Pop an item from the ring buffer. Returns true on success, false if empty.
  bool pop(T& out) noexcept {
    const uint32_t tail = tail_.load(std::memory_order_relaxed);
    const uint32_t head = head_.load(std::memory_order_acquire);
    if ((tail & mask_) == (head & mask_)) {
      // empty
      return false;
    }
    out = buffer_[tail & mask_];
    tail_.store(tail + 1, std::memory_order_release);
    return true;
  }

  // Non-allocating push that moves an item into the buffer (when T is movable)
  template<typename U>
  bool push_move(U&& item) noexcept {
    const uint32_t head = head_.load(std::memory_order_relaxed);
    const uint32_t tail = tail_.load(std::memory_order_acquire);
    if (((head + 1) & mask_) == (tail & mask_)) {
      return false;
    }
    buffer_[head & mask_] = std::forward<U>(item);
    head_.store(head + 1, std::memory_order_release);
    return true;
  }

  // Simple helpers
  size_t capacity() const noexcept { return capacity_; }

  // Approximate size (may be stale if used concurrently)
  size_t size() const noexcept {
    const uint32_t head = head_.load(std::memory_order_acquire);
    const uint32_t tail = tail_.load(std::memory_order_acquire);
    return static_cast<size_t>((head - tail) & 0xFFFFFFFFu);
  }

  bool empty() const noexcept { return size() == 0; }
  bool full() const noexcept { return size() == capacity_ - 1; }

private:
  T* buffer_;
  size_t capacity_;
  uint32_t mask_;
  std::atomic<uint32_t> head_; // producer writes head
  std::atomic<uint32_t> tail_; // consumer writes tail
};

} // namespace poietek

#endif // POIETEK_SPSC_RINGBUFFER_H
