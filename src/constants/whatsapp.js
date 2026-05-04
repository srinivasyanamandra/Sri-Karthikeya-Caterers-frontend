import { CONTACT } from './contact';

/** WhatsApp number in E.164 format (no '+', no spaces) for wa.me links. */
export const WHATSAPP_NUMBER = CONTACT.primaryPhone.tel.replace(/\D/g, '');

/** Default pre-filled enquiry message. */
export const WHATSAPP_DEFAULT_MESSAGE = "Hi, I'd like to enquire about your catering services.";

/** Build a wa.me deep link with optional pre-filled message. */
export const buildWhatsAppLink = (message = WHATSAPP_DEFAULT_MESSAGE) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
