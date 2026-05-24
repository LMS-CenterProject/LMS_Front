export function toEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // https://youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      const videoId = parsed.pathname.slice(1); // strip leading /
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // https://www.youtube.com/watch?v=VIDEO_ID
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      const videoId = parsed.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }

    // Already an embed URL or unrecognised — return as-is
    return url;
  } catch {
    return url;
  }
}
