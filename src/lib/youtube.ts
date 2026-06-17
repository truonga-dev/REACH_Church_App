export function getYoutubeId(source: string | null | undefined): string | null {
  if (!source) return null;
  if (source.length === 11 && /^[A-Za-z0-9_-]+$/.test(source)) return source;
  const match = source.match(/(?:v=|youtu\.be\/|embed\/|live\/|shorts\/)([^&?/]+)/);
  return match ? match[1] : null;
}

export function getYoutubeThumbnailUrl(
  source: string | null | undefined,
  quality: 'default' | 'mq' | 'hq' | 'sd' | 'max' = 'hq',
): string | null {
  const id = getYoutubeId(source);
  if (!id) return null;
  const map = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    sd: 'sddefault',
    max: 'maxresdefault',
  };
  return `https://img.youtube.com/vi/${id}/${map[quality]}.jpg`;
}
