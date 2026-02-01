import React, { useState } from 'react';
import { reviewsData } from './data/reviewsData';

// Reviews Page - Full dedicated page
export const ReviewsPage = () => {
  const [filter, setFilter] = useState('all');

  const filteredReviews = filter === 'all' 
    ? reviewsData 
    : reviewsData.filter(r => r.event.toLowerCase().includes(filter));

  return (
    <div className="reviews-page">
      <section className="reviews-hero">
        <div className="container">
          <h1>Client Reviews <i className="fas fa-comments"></i></h1>
          <p>Hear from our satisfied customers who trusted us with their special moments</p>
        </div>
      </section>

      <section className="reviews-stats">
        <div className="container">
          <div className="stats-grid-reviews">
            <div className="stat-card">
              <i className="fas fa-star"></i>
              <h3>5.0/5</h3>
              <p>Average Rating</p>
            </div>
            <div className="stat-card">
              <i className="fas fa-users"></i>
              <h3>Distinguished</h3>
              <p>Clientele</p>
            </div>
            <div className="stat-card">
              <i className="fas fa-award"></i>
              <h3>Trusted</h3>
              <p>By Industry Leaders</p>
            </div>
            <div className="stat-card">
              <i className="fas fa-handshake"></i>
              <h3>Long-term</h3>
              <p>Relationships</p>
            </div>
          </div>
        </div>
      </section>

      <section className="reviews-content">
        <div className="container">
          <div className="reviews-filter">
            <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
              <i className="fas fa-th"></i> All Reviews
            </button>
            <button className={filter === 'film' ? 'active' : ''} onClick={() => setFilter('film')}>
              <i className="fas fa-film"></i> Film Industry
            </button>
            <button className={filter === 'corporate' ? 'active' : ''} onClick={() => setFilter('corporate')}>
              <i className="fas fa-briefcase"></i> Corporate
            </button>
            <button className={filter === 'personal' ? 'active' : ''} onClick={() => setFilter('personal')}>
              <i className="fas fa-user"></i> Personal
            </button>
            <button className={filter === 'political' ? 'active' : ''} onClick={() => setFilter('political')}>
              <i className="fas fa-landmark"></i> Political
            </button>
            <button className={filter === 'nri' ? 'active' : ''} onClick={() => setFilter('nri')}>
              <i className="fas fa-globe"></i> NRI Weddings
            </button>
          </div>

          <div className="reviews-grid">
            {filteredReviews.map((review, idx) => (
              <div key={idx} className="review-card-detailed">
                <div className="review-header">
                  <img src={review.image} alt={review.name} className="reviewer-image" />
                  <div className="reviewer-info">
                    <h3>{review.name}</h3>
                    <div className="review-meta">
                      <span><i className="fas fa-calendar"></i> {review.date}</span>
                      <span><i className="fas fa-users"></i> {review.guests} Guests</span>
                      <span className="event-badge">{review.event}</span>
                    </div>
                  </div>
                </div>
                <div className="review-rating">
                  {[...Array(review.rating)].map((_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
                </div>
                <p className="review-text">{review.review}</p>
                <div className="review-highlights">
                  {review.highlights.map((highlight, i) => (
                    <span key={i} className="highlight-tag">
                      <i className="fas fa-check-circle"></i> {highlight}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// About Page
export const AboutPage = () => {
  const team = [
    {
      name: 'Y. R. S. Gurumurthy',
      role: 'Founder & Owner',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300',
      specialty: '30+ Years Experience',
      bio: 'Visionary leader with three decades of culinary excellence'
    },
    {
      name: 'Chef Ramesh Kumar',
      role: 'Head Chef - Indian Cuisine',
      image: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=300',
      specialty: 'North & South Indian',
      bio: 'Master of traditional Indian flavors and techniques'
    },
    {
      name: 'Chef Priya Sharma',
      role: 'Head Chef - Continental',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300',
      specialty: 'European Cuisines',
      bio: 'Bringing authentic European taste to vegetarian cuisine'
    },
    {
      name: 'Chef Arun Patel',
      role: 'Head Chef - Oriental',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
      specialty: 'Asian Fusion',
      bio: 'Expert in Pan-Asian vegetarian delicacies'
    }
  ];

  const values = [
    { icon: 'fas fa-heart', title: 'Integrity', desc: 'Built on trust and long-term relationships' },
    { icon: 'fas fa-gem', title: 'Quality', desc: 'Premium ingredients, consistent taste' },
    { icon: 'fas fa-handshake', title: 'Reliability', desc: 'Dependable service for every occasion' },
    { icon: 'fas fa-seedling', title: 'Tradition', desc: 'Rooted in authentic vegetarian cuisine' }
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>About Us <i className="fas fa-info-circle"></i></h1>
          <p>A legacy of trust, quality, and authentic vegetarian cuisine</p>
        </div>
      </section>

      <section className="founder-section-full">
        <div className="container">
          <div className="founder-content-grid">
            <div className="founder-image-wrapper">
              <img 
                src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600" 
                alt="Founder" 
                className="founder-image-large"
              />
            </div>
            <div className="founder-story">
              <h2>Our Story</h2>
              <p className="founder-quote">
                <i className="fas fa-quote-left"></i>
                Our commitment has always been simple: honor tradition, maintain the highest standards of quality, and serve with integrity. Every event we cater is an opportunity to build lasting relationships.
                <i className="fas fa-quote-right"></i>
              </p>
              <p>
                Founded by Y. R. S. Gurumurthy, Sri Karthikeya Caterers has been serving pure vegetarian cuisine with dedication and care. What began as a passion for authentic flavors has grown into a trusted name, chosen by families, institutions, and organizations across the region.
              </p>
              <p>
                Over the years, we have had the privilege of serving distinguished guests from the film industry, including respected personalities and Padma Shri awardees, as well as senior leaders and corporate institutions. We also provide daily catering services to offices and organizations such as FAPCCI, ensuring consistency and reliability.
              </p>
              <div className="founder-achievements">
                <div className="achievement">
                  <i className="fas fa-trophy"></i>
                  <span>Established Legacy</span>
                </div>
                <div className="achievement">
                  <i className="fas fa-users"></i>
                  <span>Trusted Relationships</span>
                </div>
                <div className="achievement">
                  <i className="fas fa-award"></i>
                  <span>Quality Assured</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2>Our Values</h2>
          <div className="values-grid">
            {values.map((value, idx) => (
              <div key={idx} className="value-card">
                <i className={value.icon}></i>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="team-section-full">
        <div className="container">
          <h2>Meet Our Team</h2>
          <p className="team-intro">Experienced professionals dedicated to excellence</p>
          <div className="team-grid-full">
            {team.map((member, idx) => (
              <div key={idx} className="team-card-full">
                <div className="team-image-wrapper">
                  <img src={member.image} alt={member.name} />
                </div>
                <h3>{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <p className="team-specialty">{member.specialty}</p>
                <p className="team-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Services Page - Full list
export const ServicesPage = ({ setCurrentPage }) => {
  const services = [
    {
      title: 'Wedding Catering',
      desc: 'From intimate family weddings to grand celebrations, we bring care and attention to every detail. We have had the privilege of catering for NRI weddings and high-profile events, ensuring each occasion reflects the family\'s values and traditions.',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600',
      icon: 'fas fa-heart',
      features: ['Customized Menus', 'Experienced Service Staff', 'Cultural Sensitivity', 'Intimate to Grand Scale']
    },
    {
      title: 'Corporate & Institutional Catering',
      desc: 'We provide daily catering services to corporate offices and institutions including FAPCCI and government organizations. Consistency, hygiene, and timely service are at the core of what we deliver.',
      image: '/corporate.png',
      icon: 'fas fa-briefcase',
      features: ['Daily Office Meals', 'Institutional Catering', 'Reliable Service', 'Flexible Menus']
    },
    {
      title: 'Private Celebrations',
      desc: 'Whether it\'s a family gathering, milestone celebration, or personal event, we approach each occasion with the same care and professionalism, creating memorable experiences for you and your guests.',
      image: '/private-parties.jpg',
      icon: 'fas fa-glass-cheers',
      features: ['Personalized Service', 'Flexible Planning', 'Thoughtful Presentation', 'Discreet & Professional']
    },
    {
      title: 'Religious & Cultural Events',
      desc: 'We understand the significance of religious and cultural occasions. Our team respects traditions and prepares satvik meals with care, ensuring your event is conducted with dignity and devotion.',
      image: '/religious.png',
      icon: 'fas fa-om',
      features: ['Traditional Recipes', 'Satvik Preparations', 'Cultural Respect', 'Temple & Community Events']
    }
  ];

  return (
    <div className="services-page">
      <section className="page-hero">
        <div className="container">
          <h1>Our Services <i className="fas fa-concierge-bell"></i></h1>
          <p>Catering with care for weddings, institutions, and celebrations</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="services-grid-full">
            {services.map((service, idx) => (
              <div key={idx} className="service-card-full">
                <div className="service-image-wrapper">
                  <img src={service.image} alt={service.title} className="service-image" />
                  <img src="/logo.png" alt="Watermark" className="service-watermark" />
                </div>
                <div className="service-content">
                  <h2><i className={service.icon}></i> {service.title}</h2>
                  <p>{service.desc}</p>
                  <div className="service-features">
                    {service.features.map((feature, i) => (
                      <span key={i} className="feature-tag">
                        <i className="fas fa-check"></i> {feature}
                      </span>
                    ))}
                  </div>
                  <button className="btn btn-primary" onClick={() => setCurrentPage('contact')}>
                    <i className="fas fa-calendar-check"></i> Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Menus Page - Full menu with filters
export const MenusPage = () => {
  const [activeFilter, setActiveFilter] = useState('all');

  const menus = [
    {
      title: 'Indian Classics',
      price: '₹450/plate',
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
      category: 'indian',
      tags: ['Paneer Tikka', 'Dal Makhani', 'Biryani', 'Naan', 'Raita']
    },
    {
      title: 'Continental Delights',
      price: '₹550/plate',
      image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600',
      category: 'continental',
      tags: ['Pasta Alfredo', 'Caesar Salad', 'Minestrone', 'Garlic Bread']
    },
    {
      title: 'Oriental Fusion',
      price: '₹500/plate',
      image: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600',
      category: 'oriental',
      tags: ['Hakka Noodles', 'Fried Rice', 'Dumplings', 'Spring Rolls']
    },
    {
      title: 'Mediterranean Magic',
      price: '₹600/plate',
      image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600',
      category: 'mediterranean',
      tags: ['Hummus', 'Falafel', 'Pita Bread', 'Greek Salad']
    },
    {
      title: 'South Indian Special',
      price: '₹400/plate',
      image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=600',
      category: 'indian',
      tags: ['Masala Dosa', 'Idli', 'Vada', 'Sambar', 'Chutney']
    },
    {
      title: 'Vegan Delights',
      price: '₹500/plate',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
      category: 'vegan',
      tags: ['Plant-Based', 'Dairy-Free', 'Organic', 'Healthy']
    },
    {
      title: 'Global Fusion',
      price: '₹650/plate',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
      category: 'fusion',
      tags: ['Mix Cuisine', 'Innovative Dishes', 'Gourmet Selection']
    }
  ];

  const filters = [
    { name: 'all', icon: 'fas fa-th' },
    { name: 'indian', icon: 'fas fa-pepper-hot' },
    { name: 'continental', icon: 'fas fa-wine-glass' },
    { name: 'oriental', icon: 'fas fa-dragon' },
    { name: 'mediterranean', icon: 'fas fa-fish' },
    { name: 'vegan', icon: 'fas fa-leaf' },
    { name: 'fusion', icon: 'fas fa-fire' }
  ];

  const filteredMenus = activeFilter === 'all' 
    ? menus 
    : menus.filter(menu => menu.category === activeFilter);

  return (
    <div className="menus-page">
      <section className="page-hero">
        <div className="container">
          <h1>Our Menus <i className="fas fa-utensils"></i></h1>
          <p>Explore our diverse range of vegetarian cuisines from around the world</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="menu-filter">
            {filters.map(filter => (
              <button
                key={filter.name}
                className={`filter-btn ${activeFilter === filter.name ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter.name)}
              >
                <i className={filter.icon}></i> {filter.name.charAt(0).toUpperCase() + filter.name.slice(1)}
              </button>
            ))}
          </div>

          <div className="cards-grid">
            {filteredMenus.map((menu, idx) => (
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
                  <p>Authentic flavors prepared by our expert chefs with premium ingredients</p>
                  <div className="menu-tags">
                    {menu.tags.map((tag, i) => (
                      <span key={i} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Gallery Page - Full gallery
export const GalleryPage = () => {
  const galleryImages = [
    { url: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=600', title: 'Wedding Setup', category: 'Wedding' },
    { url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600', title: 'Buffet Display', category: 'Setup' },
    { url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600', title: 'Gourmet Dishes', category: 'Food' },
    { url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=600', title: 'Indian Thali', category: 'Food' },
    { url: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600', title: 'Desserts', category: 'Food' },
    { url: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600', title: 'Fresh Ingredients', category: 'Kitchen' },
    { url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600', title: 'Corporate Event', category: 'Corporate' },
    { url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600', title: 'Private Party', category: 'Party' }
  ];

  return (
    <div className="gallery-page">
      <section className="page-hero">
        <div className="container">
          <h1>Gallery <i className="fas fa-images"></i></h1>
          <p>A visual journey through our culinary excellence and memorable events</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="gallery-grid">
            {galleryImages.map((image, idx) => (
              <div key={idx} className="gallery-item">
                <img src={image.url} alt={image.title} />
                <img src="/logo.png" alt="Watermark" className="gallery-watermark" />
                <div className="gallery-overlay">
                  <h3><i className="fas fa-image"></i> {image.title}</h3>
                  <p>{image.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

// Contact Page - Form and info
export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    eventType: '',
    guests: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! We will contact you shortly.');
    console.log('Form submitted:', formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="contact-page">
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us <i className="fas fa-envelope"></i></h1>
          <p>Get in touch for quotes, bookings, or any inquiries</p>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info-section">
              <h2>Get In Touch</h2>
              <div className="contact-info-card">
                <i className="fas fa-map-marker-alt"></i>
                <h3>Visit Us</h3>
                <p>123 Catering Street<br/>Hyderabad, Telangana 500001</p>
              </div>
              <div className="contact-info-card">
                <i className="fas fa-phone"></i>
                <h3>Call Us</h3>
                <p>+91 87907 30110<br/>+91 83175 49045<br/>Mon-Sun: 9 AM - 9 PM</p>
              </div>
              <div className="contact-info-card">
                <i className="fas fa-envelope"></i>
                <h3>Email Us</h3>
                <p>info@srikarthikeyacaterers.in<br/>Response within 24 hours</p>
              </div>
            </div>

            <div className="form-container">
              <h2>Request a Quote</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fas fa-user"></i> Full Name *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required 
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-envelope"></i> Email *</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required 
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fas fa-phone"></i> Phone *</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required 
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-calendar"></i> Event Date *</label>
                    <input 
                      type="date" 
                      name="eventDate"
                      value={formData.eventDate}
                      onChange={handleChange}
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label><i className="fas fa-list"></i> Event Type *</label>
                    <select 
                      name="eventType"
                      value={formData.eventType}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Event Type</option>
                      <option value="wedding">Wedding</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="private">Private Party</option>
                      <option value="religious">Religious Ceremony</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label><i className="fas fa-users"></i> Guests *</label>
                    <input 
                      type="number" 
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      required 
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label><i className="fas fa-comment"></i> Additional Details</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="4" 
                    placeholder="Tell us about your event..."
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary" style={{width: '100%'}}>
                  <i className="fas fa-paper-plane"></i> Submit Request
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

