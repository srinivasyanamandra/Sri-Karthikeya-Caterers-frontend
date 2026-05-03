import React from 'react';
import Reveal from '../ui/Reveal';
import { useNavigate } from '../../contexts/NavigationContext';
import { ROUTES } from '../../constants/navigation';
import trustStats from '../../data/trustStats';

const StorySection = () => {
  const navigate = useNavigate();
  return (
  <section className="story-section">
    <div className="container">
      <div className="story-grid">
        <Reveal className="story-text">
          <span className="eyebrow">Our story</span>
          <h2 className="story-title">
            Pure-vegetarian catering, served with care since 2009.
          </h2>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(ROUTES.ABOUT)}
          >
            Read our story <i className="fas fa-arrow-right" aria-hidden="true"></i>
          </button>
        </Reveal>
        <Reveal delay={1} className="story-stats">
          {trustStats.map((stat) => (
            <div key={stat.id} className="story-stat">
              <span className="story-stat-value">{stat.value}</span>
              <span className="story-stat-label">{stat.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </div>
  </section>
  );
};

export default StorySection;
