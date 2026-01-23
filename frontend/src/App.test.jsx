import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders AutoSphere Web heading', () => {
    render(<App />);
    const heading = screen.getByText(/AutoSphere Web/i);
    expect(heading).toBeInTheDocument();
  });

  it('renders welcome message', () => {
    render(<App />);
    const welcomeMessage = screen.getByText(/Comprehensive Automotive Platform/i);
    expect(welcomeMessage).toBeInTheDocument();
  });
});