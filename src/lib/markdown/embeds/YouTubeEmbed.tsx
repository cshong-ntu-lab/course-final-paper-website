// Privacy-mode YouTube iframe (no cookies until played).

export function YouTubeEmbed({ videoId, url }: { videoId?: string; url?: string }) {
  const id = videoId ?? extractIdFromUrl(url ?? "");
  if (!id) return null;
  return (
    <div className="embed embed-youtube" data-url={url}>
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

function extractIdFromUrl(url: string): string | null {
  const watch = /(?:[?&]v=)([A-Za-z0-9_-]{11})/.exec(url);
  if (watch?.[1]) return watch[1];
  const short = /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(url);
  if (short?.[1]) return short[1];
  const embed = /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/.exec(url);
  if (embed?.[1]) return embed[1];
  return null;
}
