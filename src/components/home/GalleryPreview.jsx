import React from 'react';
import Reveal from '../ui/Reveal';
import ImageWithFallback from '../ui/ImageWithFallback';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import { galleryPreview } from '../../data/gallery';

const GalleryItem = ({ img, idx }) => (
  <Reveal delay={(idx % 4) + 1} className="gallery-item">
    <ImageWithFallback
      src={img.url}
      alt={img.title}
      fallbackLabel={img.category}
      loading="lazy"
    />
    <div className="gallery-overlay">
      <h3><i className="fas fa-image" aria-hidden="true"></i> {img.title}</h3>
      <p>{img.category}</p>
    </div>
  </Reveal>
);

const GalleryPreview = () => {
  const navigate = useNavigate();

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-header">
          <span className="eyebrow">Gallery</span>
          <h2>A glimpse of <em>our work</em></h2>
          <p>Setups, plates, moments — captured across weddings, corporate events and celebrations.</p>
        </Reveal>

        <div className="gallery-grid">
          {galleryPreview.map((img, idx) => (
            <GalleryItem key={img.id} img={img} idx={idx} />
          ))}
        </div>

        <div className="section-cta-row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(ROUTES.GALLERY)}
          >
            <i className="fas fa-images" aria-hidden="true"></i> View full gallery
          </button>
        </div>
      </div>
    </section>
  );
};

export default GalleryPreview;
