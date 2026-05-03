# Client Reviews Page — Documentation

## Overview

The **Client Reviews Page** is a comprehensive, premium review submission experience designed for post-event feedback collection. It provides a structured, multi-section form that captures detailed client feedback across multiple dimensions.

## Purpose

This page serves as the primary channel for collecting in-depth client reviews after catering events. Unlike the simpler Feedback page (4 fields), this comprehensive form collects:

- **Basic event information** (name, type, date)
- **Overall satisfaction rating**
- **Six detailed ratings** (food quality, taste, presentation, staff behavior, timeliness, service quality)
- **Written feedback** (comments + suggestions)
- **Optional extras** (photo upload, recommendation toggle)

## Design Philosophy

### 1. **Brand Consistency**
- Uses existing design tokens from `tokens.css`
- Matches typography, spacing, colors, and visual rhythm
- Integrates seamlessly with existing page styles
- Maintains premium, elegant aesthetic

### 2. **Progressive Disclosure**
- Five numbered sections that build naturally
- Starts simple (basic info) → builds depth (detailed ratings) → ends optional (photo/recommend)
- Clear visual hierarchy with serif section headings
- Numbered sections (01-05) provide clear progress indicators

### 3. **Trust & Warmth**
- Trust-building intro section with icon and warm copy
- Friendly, conversational field labels and hints
- Success messages tailored to rating level (5★, 4★, ≤3★)
- Personal touch: "Read by our coordinator" messaging

### 4. **Accessibility First**
- Semantic HTML (`<fieldset>`, `<legend>`, proper labels)
- ARIA labels and live regions
- Keyboard navigation support
- High contrast, readable typography
- Focus states on all interactive elements
- Screen reader friendly

### 5. **Mobile-First Responsive**
- Touch-friendly controls (44px minimum touch targets)
- Responsive layout (stacks cleanly on mobile)
- Large, tappable star ratings
- Comfortable spacing on all screen sizes
- Works perfectly from 320px to 1920px+

## Page Structure

### Hero Section
```
Eyebrow: "Client reviews"
Title: "Share your experience"
Intro: Trust-building copy about feedback value
```

### Trust-Building Intro
- Gold star icon in circular gradient background
- "Your voice matters" heading
- Warm paragraph explaining review importance
- Sets positive, welcoming tone

### Main Form (5 Sections)

#### Section 01: Basic Information
**Required fields:**
- Name (text input)
- Event type (select dropdown)
- Event date (date picker)

**Purpose:** Connect feedback to specific event and team

#### Section 02: Overall Experience
**Required field:**
- Overall satisfaction rating (1-5 stars)

**Purpose:** Capture high-level sentiment

#### Section 03: Detailed Ratings
**Required fields (all 1-5 stars):**
- Food quality
- Taste & flavor
- Presentation & plating
- Staff behavior & professionalism
- Timeliness & punctuality
- Service quality

**Purpose:** Granular feedback across key service dimensions

#### Section 04: Written Feedback
**Required field:**
- Comments: "What did you enjoy most?" (textarea)

**Optional field:**
- Suggestions: "How can we improve?" (textarea)

**Purpose:** Capture qualitative insights and improvement ideas

#### Section 05: Optional Extras
**Optional fields:**
- Photo upload (drag-or-click, up to 5MB)
- Recommendation toggle (Yes/No)

**Purpose:** Visual evidence and referral likelihood

### Submit Button
- Large, accent-colored button
- Loading state with spinner
- Disabled during submission
- Meta text: "Read personally by our coordinator"

### Success State
- Replaces entire form
- Personalized greeting using first name
- Rating-specific success message (3 tiers)
- Contact information for follow-up
- "Submit another review" button

## Technical Implementation

### Component: `ClientReviewsPage.jsx`

**Location:** `src/pages/ClientReviewsPage.jsx`

**Dependencies:**
- `PageHero` — Hero section component
- `RatingInput` — Star rating component (1-5 stars)
- `RecommendToggle` — Yes/No recommendation toggle
- `PhotoUpload` — Drag-or-click photo upload
- `eventTypes` — Event type options data
- `validateClientReview` — Form validation function
- `CONTACT` — Contact information constants

**State Management:**
```javascript
const [formData, setFormData] = useState(INITIAL_STATE);
const [errors, setErrors] = useState({});
const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'submitted'
```

**Form Data Structure:**
```javascript
{
  // Section 1
  name: '',
  eventType: '',
  eventDate: '',
  
  // Section 2
  overallRating: 0,
  
  // Section 3
  foodQualityRating: 0,
  tasteRating: 0,
  presentationRating: 0,
  staffBehaviorRating: 0,
  timelinessRating: 0,
  serviceQualityRating: 0,
  
  // Section 4
  comments: '',
  suggestions: '',
  
  // Section 5
  photo: null,
  recommend: '',
}
```

### Validation: `validateClientReview()`

**Location:** `src/utils/validation.js`

**Rules:**
- All Section 1-3 fields are required
- Comments (Section 4) is required
- Suggestions, photo, and recommend are optional
- Returns object with field-specific error messages

**Error Display:**
- Inline errors below each field
- Red border on invalid inputs
- Focus first invalid field on submit
- ARIA live regions for screen readers

### Styles

**Location:** `src/Pages.css`

**Key Classes:**
- `.client-reviews-page` — Page wrapper
- `.client-reviews-intro` — Trust-building intro section
- `.client-reviews-form` — Main form container
- `.feedback-section` — Each numbered section
- `.feedback-section-head` — Section heading with number
- `.feedback-ratings` — Grid of rating inputs
- `.form-hint` — Helper text below fields

**Responsive Breakpoints:**
- Desktop (1024px+): Full layout, side-by-side fields
- Tablet (768px-1023px): Adjusted spacing
- Mobile (480px-767px): Stacked layout, larger touch targets
- Small phones (360px-479px): Compact spacing
- Tiny phones (320px-359px): Minimal spacing

## User Flow

### Happy Path
1. User lands on page → sees hero + trust intro
2. Fills Section 01 (basic info) → no errors
3. Rates Section 02 (overall) → 5 stars
4. Rates Section 03 (detailed) → all 4-5 stars
5. Writes Section 04 (comments) → positive feedback
6. Optionally adds Section 05 (photo + recommend)
7. Clicks "Submit review" → loading state (1s)
8. Success screen appears → personalized thank you
9. Can submit another review or navigate away

### Error Path
1. User fills form incompletely
2. Clicks "Submit review"
3. Validation runs → finds missing fields
4. Red borders appear on invalid fields
5. Inline error messages show below fields
6. Focus moves to first invalid field
7. User corrects errors → errors clear on change
8. Resubmits → success

### Low Rating Path
1. User gives 1-3 stars overall
2. Fills detailed ratings (some low)
3. Writes critical feedback in comments
4. Adds improvement suggestions
5. Submits review
6. Success message acknowledges concern
7. Copy: "We'll reach out personally to make this right"

## Integration Points

### Navigation
- Route ID: `ROUTES.CLIENT_REVIEWS` (`'client-reviews'`)
- Footer link: "Detailed review"
- Not in primary header nav (accessed via footer or direct link)

### Backend Integration
Currently simulates API call with 1-second timeout. To integrate:

```javascript
// Replace setTimeout in handleSubmit with:
const response = await fetch('/api/reviews', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData),
});

if (!response.ok) throw new Error('Submission failed');
setStatus('submitted');
```

### Photo Upload
- Currently stores file + preview in state
- Backend integration needs multipart/form-data
- Consider using FormData API or separate upload endpoint

### Email Notifications
Recommended triggers:
- Send confirmation email to client
- Alert coordinator for ratings ≤3
- Weekly digest of all reviews to management

## Customization Guide

### Adding New Rating Fields
1. Add field to `INITIAL_STATE` in `ClientReviewsPage.jsx`
2. Add validation rule in `validateClientReview()`
3. Add `<RatingInput>` component in Section 03
4. Update success copy if needed

### Changing Required Fields
1. Update validation in `validateClientReview()`
2. Remove/add asterisks (*) in field labels
3. Update `required` prop on form elements

### Modifying Success Messages
Edit `successCopy()` function in `ClientReviewsPage.jsx`:
```javascript
const successCopy = (rating) => {
  if (rating === 5) return { title: '...', body: '...' };
  if (rating === 4) return { title: '...', body: '...' };
  return { title: '...', body: '...' };
};
```

### Styling Adjustments
All styles in `src/Pages.css` under:
- `/* Client Reviews Page */` section
- Uses CSS variables from `tokens.css`
- Follows existing responsive patterns

## Accessibility Features

### Keyboard Navigation
- Tab through all form fields
- Arrow keys navigate star ratings
- Space/Enter to select ratings
- Escape to close (if modal)

### Screen Readers
- Semantic HTML structure
- Proper label associations
- ARIA live regions for errors
- Descriptive button text
- Alt text on icons

### Visual Accessibility
- High contrast text (WCAG AA+)
- Focus indicators on all controls
- Large touch targets (44px minimum)
- Readable font sizes (16px+ body)
- Color not sole indicator (icons + text)

### Reduced Motion
- Respects `prefers-reduced-motion`
- No animations for reduced-motion users
- Instant transitions instead of smooth

## Performance Considerations

### Code Splitting
- Page is lazy-loaded via `React.lazy()`
- Only fetched when user navigates to route
- Reduces initial bundle size

### Image Optimization
- Photo upload validates file size (5MB max)
- Preview uses FileReader (client-side)
- Consider image compression before upload

### Form State
- Controlled components (React state)
- Errors clear on field change (no re-validation)
- Single validation pass on submit

## Testing Recommendations

### Manual Testing
- [ ] Fill form completely → submits successfully
- [ ] Leave required fields empty → shows errors
- [ ] Upload photo → preview appears
- [ ] Remove photo → preview clears
- [ ] Test all rating inputs → values update
- [ ] Test on mobile (320px, 375px, 414px)
- [ ] Test on tablet (768px, 1024px)
- [ ] Test on desktop (1440px, 1920px)
- [ ] Test keyboard navigation
- [ ] Test with screen reader

### Automated Testing
```javascript
// Example test structure
describe('ClientReviewsPage', () => {
  it('renders all form sections', () => {});
  it('validates required fields', () => {});
  it('submits form with valid data', () => {});
  it('shows success message after submit', () => {});
  it('clears errors when user corrects field', () => {});
});
```

## Future Enhancements

### Potential Additions
1. **Multi-language support** — Translate form labels
2. **Auto-save draft** — LocalStorage persistence
3. **Email pre-fill** — URL parameter for email
4. **Rating analytics** — Show average ratings
5. **Review moderation** — Admin approval workflow
6. **Public testimonials** — Display approved reviews
7. **Social sharing** — Share review on social media
8. **Incentive program** — Discount for reviews
9. **Follow-up survey** — 30-day check-in
10. **Video upload** — Allow video testimonials

### Technical Improvements
1. **Form analytics** — Track completion rate
2. **A/B testing** — Test different copy/layouts
3. **Progressive enhancement** — Works without JS
4. **Offline support** — Service worker caching
5. **Real-time validation** — Validate as user types

## Comparison: Feedback vs Client Reviews

| Feature | Feedback Page | Client Reviews Page |
|---------|---------------|---------------------|
| **Fields** | 4 (name, event type, rating, comments) | 13+ (basic info, 7 ratings, 2 text areas, photo, recommend) |
| **Purpose** | Quick feedback | Comprehensive review |
| **Time to complete** | 1-2 minutes | 3-5 minutes |
| **Detail level** | Basic | Detailed |
| **Photo upload** | No | Yes |
| **Recommendation** | No | Yes |
| **Event date** | No | Yes |
| **Sub-ratings** | No | Yes (6 categories) |
| **Use case** | Quick post-event pulse | Full post-event review |

## Support & Maintenance

### Common Issues

**Issue:** Form doesn't submit
- Check validation errors
- Verify all required fields filled
- Check browser console for errors

**Issue:** Photo upload fails
- Verify file is image type
- Check file size < 5MB
- Test with different image formats

**Issue:** Styles look broken
- Verify `Pages.css` loaded
- Check `tokens.css` variables
- Clear browser cache

### Contact
For questions or issues with this page:
- Technical: Check `src/pages/ClientReviewsPage.jsx`
- Design: Check `src/Pages.css` (Client Reviews section)
- Validation: Check `src/utils/validation.js`

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Status:** Production Ready
