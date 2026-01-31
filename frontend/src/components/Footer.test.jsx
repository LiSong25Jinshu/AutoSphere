import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Footer from './Footer';

// Mock the AutoSphere icons
vi.mock('./icons/AutoSphereIcons', () => ({
  CarIcon: ({ size, className }) => <div data-testid="car-icon" className={className} style={{ width: size, height: size }}>🚗</div>
}));

const FooterWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Footer Component', () => {
  test('renders compact footer with brand logo', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    expect(screen.getByText('AutoSphere')).toBeInTheDocument();
    expect(screen.getByText('Your complete automotive platform')).toBeInTheDocument();
  });

  test('renders quick navigation links', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    expect(screen.getByText('Vehicles')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  test('renders contact information', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    expect(screen.getByText('📞 +233 55 008 6700')).toBeInTheDocument();
    expect(screen.getByText('📧 support@autosphere.com')).toBeInTheDocument();
  });

  test('renders social media links', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const socialLinks = screen.getAllByRole('link', { name: /Follow us on/ });
    expect(socialLinks).toHaveLength(4); // Facebook, Twitter, LinkedIn, Instagram
  });

  test('renders copyright information', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} AutoSphere`)).toBeInTheDocument();
  });

  test('renders legal links', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
  });

  test('contact links have correct attributes', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const phoneLink = screen.getByText('📞 +233 55 008 6700').closest('a');
    const emailLink = screen.getByText('📧 support@autosphere.com').closest('a');

    expect(phoneLink).toHaveAttribute('href', 'tel:+233 55 008 6700');
    expect(emailLink).toHaveAttribute('href', 'mailto:support@autosphere.com');
  });

  test('social links have correct attributes', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const facebookLink = screen.getByLabelText('Follow us on Facebook');
    expect(facebookLink).toHaveAttribute('href', 'https://facebook.com/autosphere');
    expect(facebookLink).toHaveAttribute('target', '_blank');
    expect(facebookLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});