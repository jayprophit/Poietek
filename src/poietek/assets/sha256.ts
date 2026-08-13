export async function sha256Blob(blob: Blob): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("SHA-256 asset hashing is unavailable on this platform.");
  }

  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    await blob.arrayBuffer(),
  );
  const hex = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `sha256:${hex}`;
}
