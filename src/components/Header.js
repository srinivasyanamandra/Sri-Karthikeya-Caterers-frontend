import React, { useState, useEffect } from 'react';

const Header = ({ setCurrentPage, currentPage }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-content">
        <a href="#home" className="logo" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>
          <img src="/logo.png" alt="Srikarthikeya Caterers" className="logo-image" />
        </a>
        <nav className="nav">
          <a href="#home" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}>Home</a>
          <a href="#about" onClick={(e) => { e.preventDefault(); setCurrentPage('about'); }}>About</a>
          <a href="#services" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}>Services</a>
          <a href="#menus" onClick={(e) => { e.preventDefault(); setCurrentPage('menus'); }}>Menus</a>
          <a href="#gallery" onClick={(e) => { e.preventDefault(); setCurrentPage('gallery'); }}>Gallery</a>
          <a href="#reviews" onClick={(e) => { e.preventDefault(); setCurrentPage('reviews'); }}>Reviews</a>
          <a href="#contact" onClick={(e) => { e.preventDefault(); setCurrentPage('contact'); }}>Contact</a>
        </nav>
        <div className="cta-header">
          <a href="#contact" className="btn btn-primary" onClick={(e) => { e.preventDefault(); setCurrentPage('contact'); }}>
            <i className="fas fa-calendar-check"></i> Request Quote
          </a>
          <a href="tel:+918790730110" className="btn btn-secondary">
            <i className="fas fa-phone"></i> Call Now
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
