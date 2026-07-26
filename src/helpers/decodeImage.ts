export function decodeImageSrc(raw?: string | null): string | null {
  if (!raw) return null;
  if (raw.startsWith("data:")) return raw;
  if (raw.startsWith("http")) return raw;
  return `data:image/jpeg;base64,${raw}`;
}
