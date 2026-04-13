/**
 * LoginForm — end-to-end component tests
 * Tests the full login form interaction flow.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import LoginForm from '../components/LoginForm';

// Mock the auth context
const mockLogin = vi.fn();
const mockClearError = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    error: null,
    clearError: mockClearError,
  }),
}));

vi.mock('../hooks/useAuthOperations', () => ({
  useAuthOperations: () => ({
    handleLogin: mockLogin,
    isSubmitting: false,
  }),
}));

const renderLogin = () =>
  render(
    <BrowserRouter>
      <LoginForm />
    </BrowserRouter>
  );

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation error for empty email', async () => {
    renderLogin();
    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitBtn);
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  it('shows validation error for invalid email', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows validation error for empty password', async () => {
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls handleLogin with correct credentials', async () => {
    mockLogin.mockResolvedValue({ success: true });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123',
      });
    });
  });

  it('shows error message on failed login', async () => {
    mockLogin.mockResolvedValue({ success: false, error: 'Invalid credentials' });
    renderLogin();

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'WrongPass123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('has a link to the register page', () => {
    renderLogin();
    const registerLink = screen.getByText(/sign up here/i);
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('has a forgot password link', () => {
    renderLogin();
    const forgotLink = screen.getByText(/forgot your password/i);
    expect(forgotLink.closest('a')).toHaveAttribute('href', '/forgot-password');
  });
});
