const CROCKFORD32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(timeMs: number): string {
  let value = Math.floor(timeMs);
  let out = "";
  for (let i = 0; i < 10; i += 1) {
    out = CROCKFORD32[value % 32] + out;
    value = Math.floor(value / 32);
  }
  return out;
}

function encodeRandom(bytes: Uint8Array): string {
  let bits = 0;
  let bitCount = 0;
  let out = "";

  for (const byte of bytes) {
    bits = (bits << 8) | byte;
    bitCount += 8;

    while (bitCount >= 5 && out.length < 16) {
      bitCount -= 5;
      out += CROCKFORD32[(bits >> bitCount) & 31];
    }
  }

  if (out.length < 16 && bitCount > 0) {
    out += CROCKFORD32[(bits << (5 - bitCount)) & 31];
  }

  return out.padEnd(16, "0").slice(0, 16);
}

export function createUlid(now = Date.now()): string {
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);
  return encodeTime(now) + encodeRandom(random);
}
