import React, { useMemo, useState } from 'react';
import PageHero from '../components/layout/PageHero';
import reviews from '../data/reviews';
import reviewFilters from '../data/reviewFilters';

const ReviewsPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredReviews = useMemo(
    () =>
      activeFilter === 'all'
        ? reviews
        : reviews.filter((review) => review.event.toLowerCase().includes(activeFilter)),
    [activeFilter]
  );

  return (
    <div className="reviews-page">
      <PageHero
        eyebrow="In their words"
        title="Trusted by hosts who return."
        intro="Reflections from the families, institutions and hosts who have trusted us with their most important occasions."
      />

      <section className="section section-alt">
        <div className="container">
          <div className="reviews-filter">
            {reviewFilters.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`filter-btn ${activeFilter === option.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="reviews-grid">
            {filteredReviews.map((review) => (
              <article key={review.event + review.date} className="review-card">
                <div className="review-header">
                  {/* <ImageWithFallback
                    src={review.image}
                    alt={review.name}
                    className="reviewer-image"
                    loading="lazy"
                  /> */}
                  <div className="reviewer-info">
                    {/* <h3>{review.name}</h3> */}
                    <div className="review-meta">
                      <span>{review.date}</span>
                      <span className="dot-sep" />
                      <span>{review.guests} Guests</span>
                    </div>
                  </div>
                  <span className="event-badge">{review.event}</span>
                </div>
                {/* <div className="review-rating" aria-label={`${review.rating} out of 5`}>
                  {Array.from({ length: review.rating }, (_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div> */}
                <p className="review-text">"{review.review}"</p>
                <div className="review-highlights">
                  {review.highlights.map((h) => (
                    <span key={h} className="highlight-tag">
                      {h}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReviewsPage;
