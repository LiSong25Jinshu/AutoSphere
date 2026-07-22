import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../../components/RegisterForm';
import { AuthProvider } from '../../contexts/AuthContext';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    defaults: { headers: { common: {} }, baseURL: '' },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderRegister = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <RegisterForm />
      </AuthProvider>
    </MemoryRouter>
  );

describe('E2E: Registration Form Flow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders all required fields', () => {
    renderRegister();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'DifferentPass!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it('shows error for invalid email', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/email/i), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows error for weak password', async () => {
    renderRegister();
    await userEvent.type(screen.getByLabelText(/^password$/i), '123');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('shows success message on successful registration', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Registration successful. You can log in immediately.',
      },
    });

    renderRegister();
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/registration successful/i)).toBeInTheDocument();
  });

  it('shows error on duplicate email', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'User with this email already exists' } },
    });

    renderRegister();
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password123!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Password123!');
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });

  it('has a link to login page', () => {
    renderRegister();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
