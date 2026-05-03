// Form Validation Utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateDate = (date) => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

/**
 * Validate the comprehensive client review form.
 *
 * Required fields:
 *   - Basic info: name, event type, event date
 *   - Overall rating
 *   - Six detailed ratings (food quality, taste, presentation, staff, timeliness, service)
 *   - Comments (what they enjoyed)
 *
 * Optional fields:
 *   - Suggestions for improvement
 *   - Photo upload
 *   - Recommendation toggle
 */
export const validateClientReview = (data) => {
  const errors = {};

  // Section 1: Basic Information
  if (!validateRequired(data.name)) {
    errors.name = 'Please tell us your name.';
  }
  if (!validateRequired(data.eventType)) {
    errors.eventType = 'Please select the event type.';
  }
  if (!validateRequired(data.eventDate)) {
    errors.eventDate = 'Please tell us when your event took place.';
  }

  // Section 2: Overall Experience
  if (!data.overallRating) {
    errors.overallRating = 'Please rate your overall experience.';
  }

  // Section 3: Detailed Ratings
  if (!data.foodQualityRating) {
    errors.foodQualityRating = 'Please rate the food quality.';
  }
  if (!data.tasteRating) {
    errors.tasteRating = 'Please rate the taste and flavor.';
  }
  if (!data.presentationRating) {
    errors.presentationRating = 'Please rate the presentation.';
  }
  if (!data.staffBehaviorRating) {
    errors.staffBehaviorRating = 'Please rate our staff behavior.';
  }
  if (!data.timelinessRating) {
    errors.timelinessRating = 'Please rate our timeliness.';
  }
  if (!data.serviceQualityRating) {
    errors.serviceQualityRating = 'Please rate the service quality.';
  }

  // Section 4: Written Feedback
  if (!validateRequired(data.comments)) {
    errors.comments = 'Please share what you enjoyed most about your experience.';
  }
  // suggestions is optional

  // Section 5: Optional extras (photo, recommend) — no validation needed

  return errors;
};

// Alias for backward compatibility
export const validateFeedback = validateClientReview;

export const validateForm = (formData) => {
  const errors = {};

  if (!validateRequired(formData.name)) {
    errors.name = 'Name is required';
  }

  if (!validateRequired(formData.email)) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Invalid email format';
  }

  if (!validateRequired(formData.phone)) {
    errors.phone = 'Phone is required';
  } else if (!validatePhone(formData.phone)) {
    errors.phone = 'Invalid phone number';
  }

  if (!validateRequired(formData.eventDate)) {
    errors.eventDate = 'Event date is required';
  } else if (!validateDate(formData.eventDate)) {
    errors.eventDate = 'Event date must be in the future';
  }

  if (!validateRequired(formData.eventType)) {
    errors.eventType = 'Event type is required';
  }

  if (!validateRequired(formData.guests)) {
    errors.guests = 'Number of guests is required';
  } else if (parseInt(formData.guests) < 1) {
    errors.guests = 'Must have at least 1 guest';
  }

  return errors;
};
