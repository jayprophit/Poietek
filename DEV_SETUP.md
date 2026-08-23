Developer setup — Poietek Studio

This document explains how to prepare a development machine to build, test and run Poietek Studio locally.

Prerequisites (recommended versions)
- Node.js LTS 18+ (npm or pnpm)
- Rust toolchain (rustup) — match rust-toolchain.toml or use stable (>=1.60)
- CMake 3.24+
- A C++ compiler toolchain:
  - Windows: Visual Studio 2022 Build Tools (MSVC)
  - macOS: Xcode
  - Linux: build-essential (gcc/clang)
- Optional for mobile: Android SDK/NDK, Xcode for iOS

Basic setup
1. Install Node.js and npm from https://nodejs.org/
2. Install rustup: https://rustup.rs/ (ensure rustfmt and clippy are installed)
   - rustup component add clippy rustfmt
3. Install CMake and set it on PATH
4. Clone the repository and change to the Poietek-Studio folder

Commands to build and test locally
- Install JS dependencies:
  cd Poietek-Studio
  npm ci

- Run typechecks and tests:
  npm run typecheck
  npm test

- Run the web dev server:
  npm run dev

- Native doctor (validates native toolchains):
  npm run native:doctor

- Build web frontend:
  npm run build

- Build Tauri native bundle (desktop):
  npm run native:build

- Build native-core C++ library:
  mkdir -p native-core/build && cd native-core/build
  cmake .. -DCMAKE_BUILD_TYPE=Release
  cmake --build . --config Release
  ctest --output-on-failure

Notes
- Mobile builds require additional SDKs and credentials (signing keys/provisioning profiles). See scripts for mobile targets.
- If packaging fails on CI, inspect logs for missing platform packagers (makensis on Windows, hdiutil on macOS, dpkg on Linux) and install them locally.

Support
- If you encounter toolchain issues, run `npm run native:doctor` which attempts to diagnose common native toolchain problems.
