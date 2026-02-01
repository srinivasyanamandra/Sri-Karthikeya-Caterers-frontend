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
