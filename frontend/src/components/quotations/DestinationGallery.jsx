import { resolveDestinationImages } from './destinationGalleryUtils';

export default function DestinationGallery({ quote, destination }) {
  const images = resolveDestinationImages(quote);
  if (!images.length) return null;

  const [hero, ...thumbs] = images;
  const sideImages = thumbs.slice(0, 3);
  const destLabel = destination?.split(/[,·]/)[0]?.trim() || hero.label;

  return (
    <div className="quote-ht-dest-section">
      <div className="quote-ht-section-title">Destination Highlights — {destLabel}</div>
      <div className="quote-ht-dest-gallery">
        <div className="quote-ht-dest-hero">
          <img src={hero.url} alt={hero.label} className="quote-ht-dest-img" crossOrigin="anonymous" />
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
                <img src={img.url} alt={img.label} className="quote-ht-dest-img" crossOrigin="anonymous" />
                <div className="quote-ht-dest-thumb-label">{img.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
