/**
 * Image URL utilities — normalizes vehicle photo URLs so they work
 * in both development (localhost:5001) and production (same-origin).
 */

const PLACEHOLDER = '/images/placeholder-car.svg';

/**
 * Resolve a vehicle image URL to a usable src.
 * Handles:
 *  - null / undefined → placeholder
 *  - absolute http/https URLs → returned as-is
 *  - relative /uploads/... paths → prepend API base in dev, same-origin in prod
 */
export function resolveImageUrl(url) {
  if (!url) return PLACEHOLDER;

  // Already a full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // In production, rewrite localhost references to same-origin
    if (import.meta.env.PROD && url.includes('localhost')) {
      try {
        const parsed = new URL(url);
        return parsed.pathname; // strip host → relative path served by backend
      } catch {
        return PLACEHOLDER;
      }
    }
    return url;
  }

  // Relative path (e.g. /uploads/vehicles/vehicle-123.jpg)
  return url;
}

/**
 * Get the primary image for a vehicle, with fallback.
 */
export function getVehiclePrimaryImage(vehicle) {
  const images = vehicle?.images;
  if (Array.isArray(images) && images.length > 0) {
    return resolveImageUrl(images[0]);
  }
  return PLACEHOLDER;
}

/**
 * Get all images for a vehicle, with fallback array.
 */
export function getVehicleImages(vehicle) {
  const images = vehicle?.images;
  if (Array.isArray(images) && images.length > 0) {
    return images.map(resolveImageUrl);
  }
  return [PLACEHOLDER];
}
