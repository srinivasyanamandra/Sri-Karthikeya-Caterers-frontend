import React from 'react';
import PageHero from '../components/layout/PageHero';
import ImageWithFallback from '../components/ui/ImageWithFallback';
import gallery from '../data/gallery';

const GalleryPage = () => (
  <div className="gallery-page">
    <PageHero
      eyebrow="Gallery"
      title="Moments from our table."
      intro="Setups, plates and celebrations from the events we have had the privilege of catering."
    />

    <section className="section">
      <div className="container">
        <div className="gallery-grid">
          {gallery.map((image) => (
            <div key={image.id} className="gallery-item">
              <ImageWithFallback
                src={image.url}
                alt={image.title}
                fallbackLabel={image.category}
                loading="lazy"
              />
              <div className="gallery-overlay">
                <h3>{image.title}</h3>
                <p>{image.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default GalleryPage;
