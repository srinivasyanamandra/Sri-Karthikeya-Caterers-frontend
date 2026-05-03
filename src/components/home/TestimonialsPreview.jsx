import React from 'react';
import Reveal from '../ui/Reveal';
import ImageWithFallback from '../ui/ImageWithFallback';
import { useNavigate } from '../../contexts/NavigationContext';
import { featuredReviews } from '../../data/reviews';
import { ROUTES } from '../../constants/navigation';

const TestimonialCard = ({ testimonial, index }) => {
  // const stars = '★'.repeat(testimonial.rating);
  return (
    <Reveal delay={(index % 4) + 1} className="testimonial-card">
      {/* <ImageWithFallback
        src={testimonial.image}
        alt={testimonial.name}
        className="testimonial-image"
      /> */}
      {/* <div className="stars" aria-label={`${testimonial.rating} out of 5`}>
        {stars}
      </div> */}
      <p className="testimonial-text">&ldquo;{testimonial.review}&rdquo;</p>
      {/* <div className="testimonial-author">{testimonial.name}</div> */}
      <div className="testimonial-event">{testimonial.event}</div>
    </Reveal>
  );
};

const TestimonialsPreview = () => {
  const navigate = useNavigate();

  return (
    <section className="section testimonials">
      <div className="container">
        <Reveal className="section-header">
          <span className="eyebrow">In their words</span>
          <h2>Trust, <em>built one event at a time</em></h2>
          <p>Long-standing relationships with families, institutions and discerning hosts.</p>
        </Reveal>
        <div className="cards-grid">
          {featuredReviews.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial.name}
              testimonial={testimonial}
              index={index}
            />
          ))}
        </div>
        <div className="section-cta-row">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate(ROUTES.REVIEWS)}
          >
            <i className="fas fa-comments" aria-hidden="true"></i> Read all reviews
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsPreview;
