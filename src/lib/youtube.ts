export function toYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;

  const playlistMatch = url.match(/[?&]list=([\w-]+)/);
  const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);

  if (videoMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/${videoMatch[1]}`;
  }
  if (playlistMatch?.[1]) {
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistMatch[1]}`;
  }
  return null;
}
