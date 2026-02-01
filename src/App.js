import React, { useState, useEffect } from 'react';
import './App.css';
import './Pages.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { ReviewsPage, AboutPage, ServicesPage, MenusPage, GalleryPage, ContactPage } from './Pages';
import EntryAnimation from './EntryAnimation';
import Header from './components/Header';
import Footer from './components/Footer';
import TestimonialsPreview from './components/TestimonialsPreview';
import GalleryPreview from './components/GalleryPreview';
import heroImage from './best.png';

// Hero Component
const Hero = ({ setCurrentPage }) => {
  return (
    <section className="hero" style={{ backgroundImage: `linear-gradient(135deg, rgba(15, 40, 24, 0.85) 0%, rgba(26, 71, 42, 0.75) 100%), url(${heroImage})` }}>
      <div className="hero-content">
        <h1>Pure Vegetarian Catering Rooted in Tradition</h1>
        <p>Serving discerning families and institutions with authentic flavors and quiet excellence</p>
        <div className="hero-cta">
          <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('contact'); }}>
            <i className="fas fa-file-alt"></i> Request Quote
          </a>
          <a href="#menus" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setCurrentPage('menus'); }}>
            <i className="fas fa-concierge-bell"></i> View Menus
          </a>
        </div>
      </div>
    </section>
  );
};

// Trust Bar Component - Only on Home
const TrustBar = () => {
  const trustItems = [
    { icon: 'fas fa-trophy', title: 'Established Legacy', desc: 'Trusted by Families & Institutions' },
    { icon: 'fas fa-utensils', title: 'Experienced Chefs', desc: 'Authentic Regional Cuisines' },
    { icon: 'fas fa-shield-alt', title: 'Quality Assured', desc: 'Premium Ingredients & Hygiene' },
    { icon: 'fas fa-leaf', title: '100% Vegetarian', desc: 'Pure & Traditional' }
  ];

  return (
    <section className="trust-bar">
      <div className="trust-items">
        {trustItems.map((item, idx) => (
          <div key={idx} className="trust-item">
            <div className="trust-icon"><i className={item.icon}></i></div>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

// Services Preview - Only on Home (3 cards)
const ServicesPreview = ({ setCurrentPage }) => {
  const services = [
    {
      title: 'Wedding Catering',
      desc: 'Elegant celebrations crafted with care for intimate gatherings and grand occasions.',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=600',
      icon: 'fas fa-heart'
    },
    {
      title: 'Corporate Events',
      desc: 'Reliable daily catering for offices and professional gatherings.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600',
      icon: 'fas fa-briefcase'
    },
    {
      title: 'Private Celebrations',
      desc: 'Thoughtfully curated menus for family occasions and personal milestones.',
      image: '/private-parties.jpg',
      icon: 'fas fa-glass-cheers'
    }
  ];

  return (
    <section className="section">
      <div className="container">
        <div className="section-header">
          <h2>Our Services</h2>
          <p>Catering with care for every occasion</p>
        </div>
        <div className="cards-grid">
          {services.map((service, idx) => (
            <div key={idx} className="card">
              <div className="card-image-wrapper">
                <img src={service.image} alt={service.title} className="card-image" />
                <img src="/logo.png" alt="Watermark" className="card-watermark" />
              </div>
              <div className="card-content">
                <h3><i className={service.icon}></i> {service.title}</h3>
                <p>{service.desc}</p>
                <a href="#services" className="card-link" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}>
                  Learn More <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <button className="btn btn-primary" onClick={() => setCurrentPage('services')}>
            <i className="fas fa-concierge-bell"></i> View All Services
          </button>
        </div>
      </div>
    </section>
  );
};

// Menu Preview - Only on Home (3 items)
const MenuPreview = ({ setCurrentPage }) => {
  const menus = [
    {
      title: 'Indian Classics',
      price: '₹450/plate',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
      tags: ['Paneer', 'Dal', 'Biryani']
    },
    {
      title: 'Continental Delights',
      price: '₹550/plate',
      image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=600',
      tags: ['Pasta', 'Salads', 'Soups']
    },
    {
      title: 'Oriental Fusion',
      price: '₹500/plate',
      image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600',
      tags: ['Noodles', 'Rice', 'Dumplings']
    }
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header">
          <h2>Featured Menus</h2>
          <p>Authentic regional flavors prepared with premium ingredients</p>
        </div>
        <div className="cards-grid">
          {menus.map((menu, idx) => (
            <div key={idx} className="menu-card">
              <div className="menu-image-wrapper">
                <img src={menu.image} alt={menu.title} className="menu-card-image" />
                <img src="/logo.png" alt="Watermark" className="menu-watermark" />
              </div>
              <div className="menu-card-content">
                <div className="menu-card-header">
                  <h3>{menu.title}</h3>
                  <span className="price-tag">{menu.price}</span>
                </div>
                <p>Authentic flavors prepared by expert chefs</p>
                <div className="menu-tags">
                  {menu.tags.map((tag, i) => (
                    <span key={i} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: '50px'}}>
          <button className="btn btn-primary" onClick={() => setCurrentPage('menus')}>
            <i className="fas fa-utensils"></i> View All Menus
          </button>
        </div>
      </div>
    </section>
  );
};

// Floating CTA
const FloatingCTA = ({ setCurrentPage }) => {
  return (
    <div className="floating-cta" onClick={() => setCurrentPage('contact')}>
      <i className="fas fa-phone-alt"></i> Book Now
    </div>
  );
};

// Main App Component
function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentPage]);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

  return (
    <div className="App">
      {showAnimation && <EntryAnimation onComplete={handleAnimationComplete} />}
      <Header setCurrentPage={setCurrentPage} currentPage={currentPage} />
      
      {currentPage === 'home' && (
        <>
          <Hero setCurrentPage={setCurrentPage} />
          <TrustBar />
          <ServicesPreview setCurrentPage={setCurrentPage} />
          <MenuPreview setCurrentPage={setCurrentPage} />
          <GalleryPreview setCurrentPage={setCurrentPage} />
          <TestimonialsPreview setCurrentPage={setCurrentPage} />
        </>
      )}
      
      {currentPage === 'reviews' && <ReviewsPage />}
      {currentPage === 'about' && <AboutPage />}
      {currentPage === 'services' && <ServicesPage setCurrentPage={setCurrentPage} />}
      {currentPage === 'menus' && <MenusPage />}
      {currentPage === 'gallery' && <GalleryPage />}
      {currentPage === 'contact' && <ContactPage />}
      
      <Footer setCurrentPage={setCurrentPage} />
      <FloatingCTA setCurrentPage={setCurrentPage} />
    </div>
  );
}

export default App;
