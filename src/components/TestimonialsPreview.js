import React from 'react';
import { testimonialPreviewData } from '../data/reviewsData';

const TestimonialsPreview = ({ setCurrentPage }) => {
  return (
    <section className="section testimonials">
      <div className="container">
        <div className="section-header">
          <h2>What Our Clients Say</h2>
          <p>Built on trust and long-term relationships</p>
        </div>
        <div className="cards-grid">
          {testimonialPreviewData.map((testimonial, idx) => (
            <div key={idx} className="testimonial-card">
              <img src={testimonial.image} alt={testimonial.name} className="testimonial-image" />
              <div className="stars">★★★★★</div>
              <p className="testimonial-text">"{testimonial.review}"</p>
              <div className="testimonial-author">{testimonial.name}</div>
              <div className="testimonial-event">{testimonial.event}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <button className="btn btn-primary" onClick={() => setCurrentPage('reviews')}>
            <i className="fas fa-comments"></i> View All Reviews
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsPreview;
