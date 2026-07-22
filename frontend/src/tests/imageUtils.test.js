/**
 * imageUtils — unit tests
 */
import { describe, it, expect } from 'vitest';
import { resolveImageUrl, getVehiclePrimaryImage, getVehicleImages } from '../utils/imageUtils';

describe('resolveImageUrl', () => {
  it('returns placeholder for null', () => {
    expect(resolveImageUrl(null)).toContain('placeholder');
  });

  it('returns placeholder for undefined', () => {
    expect(resolveImageUrl(undefined)).toContain('placeholder');
  });

  it('returns placeholder for empty string', () => {
    expect(resolveImageUrl('')).toContain('placeholder');
  });

  it('returns relative path as-is', () => {
    expect(resolveImageUrl('/uploads/vehicles/car.jpg')).toBe('/uploads/vehicles/car.jpg');
  });

  it('returns absolute https URL as-is in dev', () => {
    const url = 'https://example.com/car.jpg';
    expect(resolveImageUrl(url)).toBe(url);
  });
});

describe('getVehiclePrimaryImage', () => {
  it('returns first image from array', () => {
    const vehicle = { images: ['/uploads/vehicles/a.jpg', '/uploads/vehicles/b.jpg'] };
    expect(getVehiclePrimaryImage(vehicle)).toBe('/uploads/vehicles/a.jpg');
  });

  it('returns placeholder for empty images array', () => {
    expect(getVehiclePrimaryImage({ images: [] })).toContain('placeholder');
  });

  it('returns placeholder for null vehicle', () => {
    expect(getVehiclePrimaryImage(null)).toContain('placeholder');
  });

  it('returns placeholder when images is undefined', () => {
    expect(getVehiclePrimaryImage({})).toContain('placeholder');
  });
});

describe('getVehicleImages', () => {
  it('returns all images resolved', () => {
    const vehicle = { images: ['/uploads/vehicles/a.jpg', '/uploads/vehicles/b.jpg'] };
    const result = getVehicleImages(vehicle);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('/uploads/vehicles/a.jpg');
  });

  it('returns placeholder array for empty images', () => {
    const result = getVehicleImages({ images: [] });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain('placeholder');
  });
});
