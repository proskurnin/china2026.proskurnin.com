export type TripVideo = { videoId: string; title: string; dayId: string | null; createdAt: string };

export function youtubeId(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    const host = url.hostname.toLowerCase();
    const path = url.pathname.split('/').filter(Boolean);
    let id: string | null = null;
    if (['youtu.be', 'www.youtu.be'].includes(host) && path.length === 1) id = path[0];
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(host)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v');
      if (path.length === 2 && ['shorts', 'live', 'embed'].includes(path[0])) id = path[1];
    }
    if (['youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host) && path[0] === 'embed' && path.length === 2) id = path[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function validateVideoInput(value: unknown, dayIds: string[]) {
  if (!value || typeof value !== 'object') throw new Error('Заполните ссылку на YouTube.');
  const data = value as Record<string, unknown>;
  const videoId = typeof data.url === 'string' ? youtubeId(data.url) : null;
  if (!videoId) throw new Error('Нужна ссылка на отдельное видео YouTube или Shorts.');
  if (data.title !== undefined && typeof data.title !== 'string') throw new Error('Проверьте название.');
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (title.length > 160) throw new Error('Название должно быть не длиннее 160 символов.');
  const dayId = data.dayId === '' || data.dayId === null || data.dayId === undefined ? null : data.dayId;
  if (dayId !== null && (typeof dayId !== 'string' || !dayIds.includes(dayId))) throw new Error('Выберите день из маршрута.');
  return { videoId, title: title || 'Видеоотчёт о поездке', dayId: dayId as string | null };
}
