import React from 'react';
import Reveal from '../ui/Reveal';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import services from '../../data/services';

const ServicesPreview = () => {
  const navigate = useNavigate();
  const goToServices = () => navigate(ROUTES.SERVICES);

  return (
    <section className="section">
      <div className="container">
        <Reveal className="section-header">
          <span className="eyebrow">Services</span>
          <h2 className="section-title">Occasions, served with intention.</h2>
          <p>Every menu is shaped to the room, the family and the moment — never templated.</p>
        </Reveal>

        <div className="services-grid">
          {services.map((service, idx) => (
            <Reveal key={service.id} delay={Math.min(idx + 1, 4)}>
              <button
                type="button"
                className="service-tile"
                onClick={goToServices}
              >
                <div className="service-tile-image">
                  <img src={service.image} alt={service.title} loading="lazy" />
                </div>
                <div className="service-tile-body">
                  <h3>{service.title}</h3>
                  <p>{service.previewDesc}</p>
                  <span className="service-tile-link">
                    Learn more <i className="fas fa-arrow-right" aria-hidden="true"></i>
                  </span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="section-cta-row">
          <button type="button" className="btn btn-ghost" onClick={goToServices}>
            View all services
          </button>
        </div>
      </div>
    </section>
  );
};

export default ServicesPreview;
