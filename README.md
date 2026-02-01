# Srikarthikeya Caterers - Minimalistic Website

A modern, ultra-minimalistic React.js website for Srikarthikeya Caterers, showcasing pure vegetarian catering services with 30+ years of experience.

## 🎨 Design Philosophy

**Minimalistic & Aesthetic** - Following modern design best practices:
- Clean typography with Inter font family
- Neutral color palette (blacks, grays, subtle accents)
- Generous white space
- Subtle shadows and borders
- Smooth micro-interactions
- Mobile-first responsive design

## 🎯 Features

### Complete Pages
1. **Home Page**
   - Minimal hero with clear messaging
   - Trust indicators
   - Services overview
   - Menu showcase with filters
   - Gallery preview
   - Testimonials
   - Contact form

2. **Reviews Page** (Dedicated)
   - Statistics dashboard
   - Filterable reviews by event type
   - Detailed client testimonials
   - Review submission CTA

3. **About Page**
   - Founder story with visual layout
   - Company values
   - Team profiles with expertise

4. **Individual Sections**
   - Services
   - Menus (with interactive filters)
   - Gallery
   - Contact/Quote form

### Design Elements
- ✨ FontAwesome icons throughout
- 🎨 Monochromatic color scheme
- 📱 Fully responsive
- 🔘 Clean navigation
- 💫 Subtle hover effects
- ⚡ Fast and lightweight

## 🚀 Getting Started

### Installation

1. Navigate to project:
```bash
cd srikarthikeya-caterers
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

4. Open browser:
```
http://localhost:3000
```

## 🎨 Design System

### Color Palette (Minimalistic)
- **Primary**: #2D3436 (Dark charcoal)
- **Secondary**: #636E72 (Medium gray)
- **Accent**: #FDCB6E (Subtle gold - used sparingly)
- **Background**: #FFFFFF (Pure white)
- **Secondary BG**: #F8F9FA (Light gray)
- **Text**: #2D3436 (Dark) / #636E72 (Secondary)
- **Border**: #E9ECEF (Very light gray)

### Typography
- **Font Family**: Inter (Sans-serif)
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Headings**: 600 weight, tight letter-spacing
- **Body**: 400 weight, comfortable line-height

### Spacing
- Consistent 8px grid system
- Generous padding and margins
- Breathable layouts

### Components
- Rounded corners (8px, 12px, 16px)
- Subtle shadows (3 levels)
- 1px borders with light colors
- Smooth transitions (0.3s cubic-bezier)

## 📋 Pages & Sections

### Home Page
- Hero section with clear value proposition
- Trust bar with 4 key metrics
- Services grid (4 cards)
- Menu showcase with 6 categories + filters
- Gallery grid (6 images)
- Testimonials (3 featured)
- Quote request form
- Footer with links

### Reviews Page
- Hero with page title
- Statistics (4 metrics)
- Filter buttons (All, Wedding, Corporate, Religious, Private)
- Review cards (8 detailed reviews)
- CTA to submit review

### About Page
- Hero section
- Founder story (2-column layout)
- Company values (4 cards)
- Team profiles (4 members)

## 🔧 Customization

### Update Colors
Edit `src/App.css`:
```css
:root {
  --primary: #2D3436;
  --secondary: #636E72;
  --accent: #FDCB6E;
  /* ... */
}
```

### Update Content
Edit arrays in `src/App.js` and `src/Pages.js`:
- Services
- Menus
- Testimonials
- Team members
- Reviews

### Replace Images
Update image URLs in component arrays with your own images.

## 📱 Responsive Breakpoints

- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🎯 Key Features

### Interactive Elements
1. **Menu Filters**: Click to filter by cuisine type
2. **Review Filters**: Filter by event type
3. **Page Navigation**: Click header links to navigate
4. **Form Validation**: Complete quote form with validation
5. **Hover Effects**: Subtle animations on cards and buttons

### Navigation
- Sticky header with blur effect
- Smooth page transitions
- Floating CTA button
- Footer navigation

## 🚀 Performance

- Lightweight CSS (no heavy frameworks)
- Optimized images from Unsplash
- Minimal JavaScript
- Fast load times
- Smooth animations

## 📊 Components Included

### Layout
- Header (sticky)
- Hero sections
- Content sections
- Footer
- Floating CTA

### UI Elements
- Cards (service, menu, testimonial, review)
- Buttons (primary, secondary)
- Forms (inputs, selects, textarea)
- Filters (menu, reviews)
- Gallery grid
- Stats cards

### Icons
- FontAwesome 6 (free version)
- Used throughout for visual hierarchy

## 🎨 Design Principles Applied

1. **Minimalism**: Remove unnecessary elements
2. **White Space**: Let content breathe
3. **Typography**: Clear hierarchy with single font
4. **Color**: Neutral palette with subtle accents
5. **Consistency**: Uniform spacing and sizing
6. **Clarity**: Clear CTAs and navigation
7. **Accessibility**: Good contrast and readable fonts

## 📦 Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "@fortawesome/fontawesome-free": "^6.x"
}
```

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 File Structure

```
src/
├── App.js          # Main component with routing
├── App.css         # Main styles (minimalistic)
├── Pages.js        # Reviews & About pages
├── Pages.css       # Page-specific styles
├── index.js        # Entry point
└── index.css       # Base styles
```

## 🎯 Best Practices Implemented

- ✅ Semantic HTML
- ✅ Accessible design (WCAG AA)
- ✅ Mobile-first approach
- ✅ Performance optimized
- ✅ Clean code structure
- ✅ Consistent naming
- ✅ Reusable components
- ✅ Modern CSS (Grid, Flexbox)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to:
- **Netlify**: Drag & drop build folder
- **Vercel**: Connect GitHub repo
- **AWS S3**: Upload build folder
- **GitHub Pages**: Use gh-pages package

## 📞 Contact

**Srikarthikeya Caterers**
- Owner: Y. R. S. Gurumurthy
- Experience: 30+ Years
- Specialization: Pure Vegetarian Catering

---

**Built with minimalism and attention to detail** ✨
