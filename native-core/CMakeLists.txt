cmake_minimum_required(VERSION 3.24)

project(poietek_native_core VERSION 0.1.0 LANGUAGES CXX)

option(POIETEK_NATIVE_CORE_BUILD_TESTS "Build native-core tests" ON)
option(POIETEK_NATIVE_CORE_BUILD_BENCHES "Build native-core benchmarks" ON)

add_library(poietek_native_core STATIC
  src/poietek_dsp.cpp
  src/poietek_ring_api.cpp
)

# Export headers for consumption by other build systems
target_include_directories(poietek_native_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)

add_library(Poietek::native_core ALIAS poietek_native_core)

target_compile_features(poietek_native_core PUBLIC cxx_std_20)
target_include_directories(poietek_native_core
  PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

set_target_properties(poietek_native_core PROPERTIES
  CXX_EXTENSIONS OFF
  POSITION_INDEPENDENT_CODE ON
)

if(MSVC)
  target_compile_options(poietek_native_core PRIVATE /W4 /permissive- /EHsc)
else()
  target_compile_options(poietek_native_core PRIVATE -Wall -Wextra -Wpedantic -Wconversion)
endif()

if(POIETEK_NATIVE_CORE_BUILD_TESTS)
  enable_testing()
  add_executable(poietek_native_core_tests tests/poietek_dsp_tests.cpp)
  target_link_libraries(poietek_native_core_tests PRIVATE Poietek::native_core)
  target_compile_features(poietek_native_core_tests PRIVATE cxx_std_20)
  add_test(NAME poietek_native_core_tests COMMAND poietek_native_core_tests)

  # ringbuffer unit tests
  add_executable(poietek_ringbuffer_tests tests/ringbuffer_tests.cpp)
  target_link_libraries(poietek_ringbuffer_tests PRIVATE Poietek::native_core)
  target_compile_features(poietek_ringbuffer_tests PRIVATE cxx_std_20)
  add_test(NAME poietek_ringbuffer_tests COMMAND poietek_ringbuffer_tests)

  # C API ring tests
  add_executable(poietek_ring_api_tests tests/ring_api_tests.cpp)
  target_link_libraries(poietek_ring_api_tests PRIVATE Poietek::native_core)
  target_compile_features(poietek_ring_api_tests PRIVATE cxx_std_20)
  add_test(NAME poietek_ring_api_tests COMMAND poietek_ring_api_tests)

  add_executable(poietek_ring_bulk_tests tests/ring_bulk_tests.cpp)
  target_link_libraries(poietek_ring_bulk_tests PRIVATE Poietek::native_core)
  target_compile_features(poietek_ring_bulk_tests PRIVATE cxx_std_20)
  add_test(NAME poietek_ring_bulk_tests COMMAND poietek_ring_bulk_tests)
endif()

if(POIETEK_NATIVE_CORE_BUILD_BENCHES)
  add_executable(poietek_native_core_bench bench/bench_main.cpp)
  target_link_libraries(poietek_native_core_bench PRIVATE Poietek::native_core)
  target_compile_features(poietek_native_core_bench PRIVATE cxx_std_20)
  # Provide a simple target to run the bench from build tree
endif()
