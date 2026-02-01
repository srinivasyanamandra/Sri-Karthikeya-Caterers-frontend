import React, { useState } from 'react';

// Menu Builder Component - Interactive Custom Menu Creation
export const MenuBuilder = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [step, setStep] = useState(1);

  const menuCategories = {
    starters: ['Paneer Tikka', 'Veg Spring Rolls', 'Corn Soup', 'Bruschetta'],
    mains: ['Paneer Butter Masala', 'Veg Biryani', 'Pasta Alfredo', 'Thai Curry'],
    breads: ['Naan', 'Roti', 'Garlic Bread', 'Pita'],
    desserts: ['Gulab Jamun', 'Ice Cream', 'Tiramisu', 'Kheer']
  };

  const toggleItem = (item) => {
    setSelectedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  return (
    <div className="menu-builder">
      <h2>Build Your Custom Menu</h2>
      <div className="builder-progress">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Starters</div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Mains</div>
        <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Breads</div>
        <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Desserts</div>
      </div>
      
      <div className="builder-content">
        {Object.entries(menuCategories).map(([category, items]) => (
          <div key={category} className="category-section">
            <h3>{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
            <div className="items-grid">
              {items.map(item => (
                <div 
                  key={item}
                  className={`builder-item ${selectedItems.includes(item) ? 'selected' : ''}`}
                  onClick={() => toggleItem(item)}
                >
                  <span>{item}</span>
                  {selectedItems.includes(item) && <span className="check">✓</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="builder-summary">
        <h3>Selected Items: {selectedItems.length}</h3>
        <button className="btn btn-primary">Download Menu PDF</button>
      </div>
    </div>
  );
};

// Pricing Calculator Component
export const PricingCalculator = () => {
  const [guests, setGuests] = useState(100);
  const [menuType, setMenuType] = useState('standard');
  const [serviceType, setServiceType] = useState('buffet');

  const menuPrices = {
    standard: 450,
    premium: 650,
    luxury: 850
  };

  const serviceMultiplier = {
    buffet: 1,
    plated: 1.2,
    family: 0.9
  };

  const calculateTotal = () => {
    const basePrice = menuPrices[menuType];
    const multiplier = serviceMultiplier[serviceType];
    return (basePrice * guests * multiplier).toLocaleString('en-IN');
  };

  return (
    <div className="pricing-calculator">
      <h2>Estimate Your Event Cost</h2>
      
      <div className="calculator-inputs">
        <div className="calc-group">
          <label>Number of Guests</label>
          <input 
            type="range" 
            min="50" 
            max="1000" 
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          />
          <span className="calc-value">{guests} guests</span>
        </div>

        <div className="calc-group">
          <label>Menu Type</label>
          <select value={menuType} onChange={(e) => setMenuType(e.target.value)}>
            <option value="standard">Standard (₹450/plate)</option>
            <option value="premium">Premium (₹650/plate)</option>
            <option value="luxury">Luxury (₹850/plate)</option>
          </select>
        </div>

        <div className="calc-group">
          <label>Service Style</label>
          <select value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
            <option value="buffet">Buffet Style</option>
            <option value="plated">Plated Service (+20%)</option>
            <option value="family">Family Style (-10%)</option>
          </select>
        </div>
      </div>

      <div className="calc-result">
        <h3>Estimated Total</h3>
        <div className="total-price">₹{calculateTotal()}</div>
        <p className="calc-note">*Final price may vary based on specific requirements</p>
        <button className="btn btn-primary">Get Detailed Quote</button>
      </div>
    </div>
  );
};

// Tasting Scheduler Component
export const TastingScheduler = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);

  const availableSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', 
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const handleBooking = () => {
    alert(`Tasting session booked for ${selectedDate} at ${selectedTime} for ${guests} guests`);
  };

  return (
    <div className="tasting-scheduler">
      <h2>Book a Free Tasting Session</h2>
      <p>Experience our culinary excellence before your event</p>

      <div className="scheduler-form">
        <div className="form-group">
          <label>Select Date</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className="form-group">
          <label>Select Time Slot</label>
          <div className="time-slots">
            {availableSlots.map(slot => (
              <button
                key={slot}
                className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                onClick={() => setSelectedTime(slot)}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Number of Guests (Max 4)</label>
          <input 
            type="number" 
            min="1" 
            max="4"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-primary"
          onClick={handleBooking}
          disabled={!selectedDate || !selectedTime}
        >
          Confirm Booking
        </button>
      </div>

      <div className="tasting-info">
        <h3>What to Expect</h3>
        <ul>
          <li>✓ Sample 8-10 signature dishes</li>
          <li>✓ Meet our head chef</li>
          <li>✓ Discuss menu customization</li>
          <li>✓ Get instant quote</li>
          <li>✓ Complimentary consultation</li>
        </ul>
      </div>
    </div>
  );
};

// FAQ Component
export const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: 'What is your minimum order quantity?',
      a: 'We cater to events starting from 50 guests. For smaller gatherings, please contact us for special arrangements.'
    },
    {
      q: 'How far in advance should I book?',
      a: 'We recommend booking at least 2-3 months in advance for weddings and large events. For smaller events, 2-4 weeks notice is preferred.'
    },
    {
      q: 'Do you provide serving staff?',
      a: 'Yes, we provide professional serving staff, including waiters, chefs, and event coordinators as part of our service packages.'
    },
    {
      q: 'Can you accommodate dietary restrictions?',
      a: 'Absolutely! We specialize in pure vegetarian cuisine and can accommodate vegan, gluten-free, and other dietary requirements.'
    },
    {
      q: 'What areas do you serve?',
      a: 'We primarily serve Hyderabad and surrounding areas within 100km. For events beyond this range, please contact us for arrangements.'
    },
    {
      q: 'Do you offer tasting sessions?',
      a: 'Yes! We offer complimentary tasting sessions for events with 100+ guests. Book your session through our website.'
    }
  ];

  return (
    <div className="faq-section">
      <h2>Frequently Asked Questions</h2>
      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <div 
              className="faq-question"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <h3>{faq.q}</h3>
              <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
            </div>
            {openIndex === index && (
              <div className="faq-answer">
                <p>{faq.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Blog Preview Component
export const BlogPreview = () => {
  const posts = [
    {
      title: '10 Tips for Planning the Perfect Wedding Menu',
      excerpt: 'Discover expert tips for creating a memorable dining experience for your special day...',
      date: 'March 15, 2024',
      image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400'
    },
    {
      title: 'The Rise of Fusion Vegetarian Cuisine',
      excerpt: 'Explore how traditional vegetarian dishes are being reimagined with global flavors...',
      date: 'March 10, 2024',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400'
    },
    {
      title: 'Corporate Event Catering: A Complete Guide',
      excerpt: 'Everything you need to know about planning successful corporate catering events...',
      date: 'March 5, 2024',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400'
    }
  ];

  return (
    <div className="blog-preview">
      <h2>Latest from Our Blog</h2>
      <div className="blog-grid">
        {posts.map((post, index) => (
          <div key={index} className="blog-card">
            <img src={post.image} alt={post.title} />
            <div className="blog-content">
              <span className="blog-date">{post.date}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <a href="#blog" className="read-more">Read More →</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Stats Counter Component
export const StatsCounter = () => {
  const stats = [
    { number: '30+', label: 'Years Experience' },
    { number: '5000+', label: 'Events Catered' },
    { number: '50+', label: 'Expert Chefs' },
    { number: '100%', label: 'Client Satisfaction' }
  ];

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <div key={index} className="stat-item">
            <div className="stat-number">{stat.number}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  MenuBuilder,
  PricingCalculator,
  TastingScheduler,
  FAQ,
  BlogPreview,
  StatsCounter
};
