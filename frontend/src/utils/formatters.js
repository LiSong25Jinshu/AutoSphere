/**
 * Utility functions for text formatting across the AutoSphere platform.
 */

/**
 * Format internal raw category strings (e.g. "car_wash", "car-wash", "oil_change")
 * to human-readable clean labels ("Car Wash", "Oil Change").
 */
export const formatCategory = (cat) => {
  if (!cat) return 'General';
  // Replace underscores and hyphens with spaces
  const cleaned = String(cat).replace(/[-_]/g, ' ');
  // Capitalize words
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Format phone number string into a clean readable format (e.g., +233 ... or (555) ...).
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Format status string into clean title case without underscores.
 */
export const formatStatus = (status) => {
  if (!status) return 'Pending';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};
