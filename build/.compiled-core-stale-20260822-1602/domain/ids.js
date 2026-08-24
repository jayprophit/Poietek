"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newId = newId;
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function encodeTime(time, length = 10) {
    let value = Math.floor(time);
    let result = "";
    for (let i = 0; i < length; i += 1) {
        result = ALPHABET[value % 32] + result;
        value = Math.floor(value / 32);
    }
    return result;
}
function encodeRandom(length = 16) {
    if (!globalThis.crypto?.getRandomValues) {
        throw new Error("Secure random ID generation is unavailable on this platform.");
    }
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    let result = "";
    for (let i = 0; i < length; i += 1) {
        result += ALPHABET[bytes[i] % 32];
    }
    return result;
}
function newId(prefix) {
    return `${prefix}_${encodeTime(Date.now())}${encodeRandom()}`;
}
