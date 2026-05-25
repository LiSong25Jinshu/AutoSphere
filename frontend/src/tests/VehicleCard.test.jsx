/**
 * VehicleCard — end-to-end component tests
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import VehicleCard from '../components/VehicleCard';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockVehicle = {
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 28500,
  mileage: 15000,
  fuelType: 'gasoline',
  transmission: 'automatic',
  bodyType: 'sedan',
  color: 'Silver',
  availabilityType: 'sale',
  images: ['/uploads/vehicles/test-car.jpg'],
  description: 'A great car',
  dealerId: 5,
};

const renderCard = (props = {}) =>
  render(
    <BrowserRouter>
      <VehicleCard vehicle={mockVehicle} {...props} />
    </BrowserRouter>
  );

describe('VehicleCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders vehicle title', () => {
    renderCard();
    expect(screen.getByText('2022 Toyota Camry')).toBeInTheDocument();
  });

  it('renders formatted price', () => {
    renderCard();
    expect(screen.getByText('GH₵ 28,500')).toBeInTheDocument();
  });

  it('renders mileage', () => {
    renderCard();
    expect(screen.getByText(/15,000 miles/i)).toBeInTheDocument();
  });

  it('renders fuel type', () => {
    renderCard();
    expect(screen.getByText(/gasoline/i)).toBeInTheDocument();
  });

  it('renders For Sale badge', () => {
    renderCard();
    expect(screen.getByText('For Sale')).toBeInTheDocument();
  });

  it('navigates to vehicle details on View Details click', async () => {
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: /view details/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/vehicles/1');
  });

  it('calls onFavorite when heart icon clicked', async () => {
    const onFavorite = vi.fn();
    renderCard({ onFavorite });
    const favoriteBtn = screen.getByLabelText(/add to favorites/i);
    await userEvent.click(favoriteBtn);
    expect(onFavorite).toHaveBeenCalledWith(1);
  });

  it('shows filled heart when isFavorited is true', () => {
    renderCard({ isFavorited: true });
    expect(screen.getByLabelText(/remove from favorites/i)).toBeInTheDocument();
  });

  it('uses placeholder image when no images provided', () => {
    const vehicleNoImages = { ...mockVehicle, images: [] };
    render(
      <BrowserRouter>
        <VehicleCard vehicle={vehicleNoImages} />
      </BrowserRouter>
    );
    const img = screen.getByRole('img', { name: /2022 toyota camry/i });
    expect(img.src).toContain('placeholder');
  });
});
