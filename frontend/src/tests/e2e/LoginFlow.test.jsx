import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginForm from '../../components/LoginForm';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock axios to avoid real network calls
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

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const renderLogin = () =>
  render(
    <MemoryRouter>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>
  );

describe('E2E: Login Form Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email format', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows validation error for short password', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), '123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const passwordInput = screen.getByLabelText(/password/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByLabelText(/toggle password visibility/i);
    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await userEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('shows error message on failed login', async () => {
    const axios = (await import('axios')).default;
    axios.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password' } },
    });

    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('has a link to forgot password page', () => {
    renderLogin();
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
  });

  it('has a link to register page', () => {
    renderLogin();
    expect(screen.getByText(/sign up here/i)).toBeInTheDocument();
  });
});
