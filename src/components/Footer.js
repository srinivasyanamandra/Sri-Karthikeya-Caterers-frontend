import React from 'react';

const Footer = ({ setCurrentPage }) => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <img src="/logo.png" alt="Srikarthikeya Caterers" className="footer-logo" />
          <h3>Sri Karthikeya Caterers</h3>
          <p>Pure vegetarian catering excellence. Making your events memorable with authentic flavors and reliable service.</p>
          <div className="social-links">
            <a href="#facebook" className="social-icon"><i className="fab fa-facebook-f"></i></a>
            <a href="#instagram" className="social-icon"><i className="fab fa-instagram"></i></a>
            <a href="#twitter" className="social-icon"><i className="fab fa-twitter"></i></a>
            <a href="#youtube" className="social-icon"><i className="fab fa-youtube"></i></a>
          </div>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#home" onClick={(e) => { e.preventDefault(); setCurrentPage('home'); }}><i className="fas fa-home"></i> Home</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); setCurrentPage('about'); }}><i className="fas fa-info-circle"></i> About Us</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}><i className="fas fa-concierge-bell"></i> Services</a></li>
            <li><a href="#menus" onClick={(e) => { e.preventDefault(); setCurrentPage('menus'); }}><i className="fas fa-utensils"></i> Menus</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Services</h3>
          <ul>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}><i className="fas fa-heart"></i> Wedding Catering</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}><i className="fas fa-briefcase"></i> Corporate Events</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}><i className="fas fa-glass-cheers"></i> Private Parties</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); setCurrentPage('services'); }}><i className="fas fa-om"></i> Religious Events</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact Info</h3>
          <ul>
            <li><i className="fas fa-map-marker-alt"></i> Hyderabad, Telangana</li>
            <li><i className="fas fa-phone"></i> +91 87907 30110</li>
            <li><i className="fas fa-phone"></i> +91 83175 49045</li>
            <li><i className="fas fa-envelope"></i> info@srikarthikeyacaterers.in</li>
            <li><i className="fas fa-clock"></i> Mon-Sun: 9 AM - 9 PM</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 Srikarthikeya Caterers. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
