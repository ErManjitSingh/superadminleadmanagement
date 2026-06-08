import { useEffect, useState } from 'react';
import { resolveDestinationImages } from './destinationGalleryUtils';

function GalleryImage({ src, alt, className, style }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`quote-ht-dest-fallback ${className || ''}`}
        style={style}
        aria-label={alt}
      >
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      loading="eager"
      decoding="sync"
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export default function DestinationGallery({ quote, destination, hideSectionTitle = false }) {
  const images = resolveDestinationImages(quote);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!images.length) return undefined;
    let cancelled = false;
    const preload = images.map(
      (img) =>
        new Promise((resolve) => {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.referrerPolicy = 'no-referrer';
          el.onload = () => resolve(true);
          el.onerror = () => resolve(false);
          el.src = img.url;
        })
    );
    Promise.all(preload).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, [quote?._id, quote?.quoteNumber, images.map((i) => i.url).join('|')]);

  if (!images.length) return null;

  const [hero, ...thumbs] = images;
  const sideImages = thumbs.slice(0, 3);
  const destLabel = destination?.split(/[,·]/)[0]?.trim() || hero.label;

  return (
    <div className="quote-ht-dest-section">
      {!hideSectionTitle && (
        <div className="quote-ht-section-title">Destination Highlights — {destLabel}</div>
      )}
      <div className={`quote-ht-dest-gallery ${ready ? 'quote-ht-dest-ready' : ''}`}>
        <div className="quote-ht-dest-hero">
          <GalleryImage
            src={hero.url}
            alt={hero.label}
            className="quote-ht-dest-img quote-ht-dest-img-hero"
          />
          <div className="quote-ht-dest-hero-overlay">
            <span className="quote-ht-dest-badge">Your Journey</span>
            <h3 className="quote-ht-dest-hero-title">{hero.label}</h3>
            <p className="quote-ht-dest-hero-sub">{destination}</p>
          </div>
        </div>
        {sideImages.length > 0 && (
          <div className="quote-ht-dest-stack">
            {sideImages.map((img) => (
              <div key={img.url} className="quote-ht-dest-thumb">
                <GalleryImage
                  src={img.url}
                  alt={img.label}
                  className="quote-ht-dest-img"
                />
                <div className="quote-ht-dest-thumb-label">{img.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
