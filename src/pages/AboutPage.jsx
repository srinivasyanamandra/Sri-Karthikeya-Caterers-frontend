import React from 'react';
import PageHero from '../components/layout/PageHero';
import values from '../data/values';
import { CONTACT } from '../constants/contact';

const AboutPage = () => (
  <div className="about-page">
    <PageHero
      eyebrow="Our story"
      title="Authentic taste, premium experience."
      intro="Pure-vegetarian catering, built quietly since 2009 on long relationships with families and institutions."
    />

    <section className="section">
      <div className="container">
        <div className="founder-grid">
          <div className="founder-logo-wrapper">
            <img
              src="/founder.png"
              alt={`${CONTACT.proprietor}, Founder of ${CONTACT.brand}`}
              className="founder-logo"
            />
            <div className="founder-caption">
              <p className="founder-name">{CONTACT.proprietor}</p>
              <p className="founder-title">Founder, {CONTACT.brand}</p>
            </div>
          </div>
          <div className="founder-story">
            <span className="eyebrow">The founder's word</span>
            <h2 className="section-title">Built on trust. Guided by standards.</h2>
            <p className="founder-quote">
              "The belief has always been clear — when someone trusts us with their event, 
              we owe them our very best. Every detail matters, every commitment counts, 
              and every experience should reflect care, quality, and respect."
            </p>
            <p>
              Sri Karthikeya Caterers was founded with a simple but enduring vision — to 
              deliver catering that is defined by consistency, discipline, and genuine care. 
              At its core lies a deep understanding that every event is important, and every 
              client places their trust in the hands of those who serve them. With years of 
              experience shaping its foundation, the approach has remained unchanged: to listen 
              closely, to plan thoughtfully, and to execute with precision.
            </p>
            <p>
              From intimate gatherings to large-scale occasions, every detail is handled with 
              the same level of attention and commitment. More than just service, it is a 
              responsibility — to honour expectations, to maintain the highest standards, and 
              to ensure that every event is carried out seamlessly. That commitment continues 
              to guide every decision, ensuring that each experience is not only well-managed, 
              but truly valued.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">What we stand for</span>
          <h2 className="section-title">Our values</h2>
          <p>The four ideas that shape every plate we serve.</p>
        </div>
        <div className="values-grid">
          {values.map((value) => (
            <div key={value.id} className="value-card">
              <span className="value-icon"><i className={value.icon} aria-hidden="true"></i></span>
              <h3>{value.title}</h3>
              <p>{value.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </div>
);

export default AboutPage;
