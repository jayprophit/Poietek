Contributing to Poietek Studio

Thank you for your interest! Please follow these guidelines to contribute:

1. Fork the repository and create a feature branch from main.
2. Write clear commit messages and include tests for new functionality.
3. Run the full local checks before pushing:
   - npm ci && npm run typecheck && npm test
   - Build native-core and run ctest
4. Open a pull request against main and describe the change and why it's needed.
5. Ensure CI passes on your PR; maintainers will review and request changes if required.

Coding standards
- JavaScript/TypeScript: follow existing project style; prefer TypeScript for core logic.
- C++: follow modern C++ (C++20) conventions used in native-core. Use clang-tidy and format with clang-format where possible.
- Rust: follow rustfmt and clippy guidance in src-tauri.

Contact
- Open an issue for large design proposals before implementing.
