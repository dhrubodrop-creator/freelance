export function toYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  const id = match?.[1];
  return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
}
