import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders AutoSphere brand in navigation', () => {
    render(<App />);
    const brandLink = screen.getByText('AutoSphere');
    expect(brandLink).toBeInTheDocument();
  });

  it('renders Auto-style navigation', () => {
    render(<App />);
    
    // Check for Auto-style navigation container
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('auto-nav');
    
    // Check for navigation links within the nav container
    const navContainer = nav.querySelector('.auto-nav-links');
    expect(navContainer).toBeInTheDocument();
    
    // Check for utility links
    const utilsContainer = nav.querySelector('.auto-nav-utils');
    expect(utilsContainer).toBeInTheDocument();
  });

  it('renders correct public navigation links', () => {
    render(<App />);
    
    // Check for public navigation links within the navigation container
    const nav = screen.getByRole('navigation');
    const navLinks = nav.querySelector('.auto-nav-links');
    
    expect(navLinks).toBeInTheDocument();
    
    // Check for specific navigation links within the nav links container
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vehicles' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'About' })).toHaveLength(2); // One in nav, one in footer
    expect(screen.getAllByRole('link', { name: 'Contact' })).toHaveLength(2); // One in nav, one in footer
    expect(screen.getByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('renders landing page hero content', () => {
    render(<App />);
    
    // Check for hero section content
    expect(screen.getByText('Premium Vehicle Marketplace')).toBeInTheDocument();
    expect(screen.getByText('Discover Your Perfect Vehicle')).toBeInTheDocument();
  });

  it('renders Auto-style footer', () => {
    render(<App />);
    
    // Check for Auto-style footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('auto-footer');
  });
});