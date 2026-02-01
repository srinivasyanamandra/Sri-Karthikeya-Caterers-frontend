import React from 'react';

const GalleryPreview = ({ setCurrentPage }) => {
  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600', title: 'Wedding Setup' },
    { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', title: 'Buffet Display' },
    { url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', title: 'Indian Thali' }
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2>Gallery</h2>
          <p>A glimpse of our culinary excellence</p>
        </div>
        <div className="gallery-grid">
          {galleryImages.map((image, idx) => (
            <div key={idx} className="gallery-item">
              <img src={image.url} alt={image.title} />
              <img src="/logo.png" alt="Watermark" className="gallery-watermark" />
              <div className="gallery-overlay">
                <h3><i className="fas fa-image"></i> {image.title}</h3>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <button className="btn btn-primary" onClick={() => setCurrentPage('gallery')}>
            <i className="fas fa-images"></i> View Full Gallery
          </button>
        </div>
      </div>
    </section>
  );
};

export default GalleryPreview;
