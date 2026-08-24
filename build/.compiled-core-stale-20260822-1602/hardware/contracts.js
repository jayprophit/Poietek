"use strict";
/**
 * Serializable hardware, routing and clock-domain contracts.
 *
 * These records deliberately separate desired configuration from observations.
 * A saved profile or routing choice is not evidence that a device is connected,
 * that a clock is locked, or that a latency value has been measured.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HARDWARE_FOUNDATION_EXTENSION_KEY = exports.HARDWARE_FOUNDATION_SCHEMA_VERSION = void 0;
exports.HARDWARE_FOUNDATION_SCHEMA_VERSION = "1.0.0";
exports.HARDWARE_FOUNDATION_EXTENSION_KEY = "org.poietek.hardware-foundation";
