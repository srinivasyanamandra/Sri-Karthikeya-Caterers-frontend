import React from 'react';
import PageHero from '../components/layout/PageHero';
import services from '../data/services';
import { useNavigate } from '../contexts/NavigationContext';
import { ROUTES } from '../constants/navigation';

const ServicesPage = () => {
  const navigate = useNavigate();
  const requestQuote = () => navigate(ROUTES.CONTACT);

  return (
    <div className="services-page">
      <PageHero
        eyebrow="Services"
        title="What we cater"
        intro="Pure-vegetarian catering for weddings, institutions and celebrations — at every scale."
      />

      <section className="section">
        <div className="container">
          <div className="services-grid">
            {services.map((service) => (
              <article key={service.id} className="service-tile service-tile-detailed">
                <div className="service-tile-image">
                  <img src={service.image} alt={service.title} loading="lazy" />
                </div>
                <div className="service-tile-body">
                  <h3>{service.title}</h3>
                  <p>{service.fullDesc}</p>
                  <ul className="service-features">
                    {service.features.map((feature) => (
                      <li key={feature}>
                        <i className="fas fa-check" aria-hidden="true"></i> {feature}
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="btn btn-secondary" onClick={requestQuote}>
                    Request a quote <i className="fas fa-arrow-right" aria-hidden="true"></i>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
