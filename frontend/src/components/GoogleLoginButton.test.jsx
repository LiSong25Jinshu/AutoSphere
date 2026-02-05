import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GoogleLoginButton from './GoogleLoginButton';

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('GoogleLoginButton', () => {
  it('renders Google login button', () => {
    render(<GoogleLoginButton />);
    
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toBeInTheDocument();
    
    const googleImage = screen.getByAltText('Google');
    expect(googleImage).toBeInTheDocument();
  });

  it('redirects to Google OAuth when clicked', () => {
    render(<GoogleLoginButton />);
    
    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);
    
    expect(window.location.href).toBe('http://localhost:5001/api/auth/google');
  });

  it('is disabled when disabled prop is true', () => {
    render(<GoogleLoginButton disabled={true} />);
    
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toBeDisabled();
  });

  it('uses custom backend URL from environment', () => {
    // Mock environment variable
    const originalEnv = process.env.REACT_APP_BACKEND_URL;
    process.env.REACT_APP_BACKEND_URL = 'https://api.example.com';
    
    render(<GoogleLoginButton />);
    
    const button = screen.getByRole('button', { name: /continue with google/i });
    fireEvent.click(button);
    
    expect(window.location.href).toBe('https://api.example.com/api/auth/google');
    
    // Restore original environment
    process.env.REACT_APP_BACKEND_URL = originalEnv;
  });
});