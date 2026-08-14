import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import VehiclesPage from './VehiclesPage';
import { vehicleService } from '../../services/vehicleService';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false }),
}));

vi.mock('../../services/vehicleService', () => ({
  vehicleService: {
    getVehicles: vi.fn(),
  },
}));

describe('VehiclesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders real database vehicles instead of falling back to mock data', async () => {
    vehicleService.getVehicles.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: 99,
            make: 'Ford',
            model: 'Focus',
            year: 2023,
            price: 20000,
            mileage: 5000,
            condition: 'used',
            fuelType: 'gasoline',
            transmission: 'automatic',
            bodyType: 'sedan',
            images: ['https://example.com/focus.jpg'],
            status: 'available',
            isFeatured: true,
            location: { city: 'Accra', state: 'Greater Accra' },
          },
        ],
        pagination: { total: 1 },
      },
    });

    render(
      <MemoryRouter>
        <VehiclesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2023 Ford Focus/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/Toyota Camry/i)).not.toBeInTheDocument();
  });
});
