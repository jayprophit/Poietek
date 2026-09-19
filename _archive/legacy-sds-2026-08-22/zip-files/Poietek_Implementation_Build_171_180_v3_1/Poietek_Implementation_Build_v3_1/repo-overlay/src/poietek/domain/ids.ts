const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(time: number, length = 10): string {
  let value = Math.floor(time);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result = ALPHABET[value % 32] + result;
    value = Math.floor(value / 32);
  }
  return result;
}

function encodeRandom(length = 16): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += ALPHABET[bytes[i] % 32];
  }
  return result;
}

export function newId(prefix: string): string {
  return `${prefix}_${encodeTime(Date.now())}${encodeRandom()}`;
}
