import React, { useEffect, useState } from 'react';
import PageHero from '../components/layout/PageHero';
import { publicApi } from '../services/api';

/**
 * Public reviews page — fetches APPROVED + isPublic reviews from the
 * backend (`GET /api/public/reviews/public`). The first 48 rows are
 * rendered as a single, calm grid — no filter chips, on the principle
 * that fewer controls feel more premium and let the testimonials
 * themselves carry the page.
 */
const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    publicApi
      .listPublicReviews({ page: 0, limit: 48 })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        setReviews(
          items.map((r) => ({
            id: r.id,
            name: r.reviewerName || 'Verified guest',
            event: r.eventType || 'Event',
            date: r.eventDate || r.submittedAt || '',
            guests: r.guests || '—',
            review: r.comments || '',
            rating: r.overallRating || 5,
            highlights: [],
            isFeatured: !!r.isFeatured,
          }))
        );
        setError('');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.message || 'Could not load reviews.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="reviews-page">
      <PageHero
        eyebrow="In their words"
        title="Trusted by hosts who return."
        intro="Reflections from the families, institutions and hosts who have trusted us with their most important occasions."
      />

      <section className="section section-alt">
        <div className="container">
          {loading && (
            <p style={{ textAlign: 'center', padding: '2rem 0' }}>
              <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>{' '}
              Loading reviews…
            </p>
          )}

          {!loading && error && (
            <p className="form-error" role="alert" style={{ textAlign: 'center' }}>
              {error}
            </p>
          )}

          {!loading && !error && reviews.length === 0 && (
            <p style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
              No reviews yet — be among the first to share your experience.
            </p>
          )}

          <div className="reviews-grid">
            {reviews.map((review) => (
              <article key={review.id || review.event + review.date} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <h3>{review.name}</h3>
                    <div className="review-meta">
                      <span>{review.date}</span>
                      {review.guests && review.guests !== '—' && (
                        <>
                          <span className="dot-sep" />
                          <span>{review.guests} Guests</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="event-badge">{review.event}</span>
                </div>
                <div className="review-rating" aria-label={`${review.rating} out of 5`}>
                  {Array.from({ length: review.rating || 5 }, (_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <p className="review-text">"{review.review}"</p>
                {review.highlights?.length > 0 && (
                  <div className="review-highlights">
                    {review.highlights.map((h) => (
                      <span key={h} className="highlight-tag">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ReviewsPage;
