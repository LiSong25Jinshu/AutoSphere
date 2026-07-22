import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

const FooterWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Auto-Style Footer Component', () => {
  test('renders Auto-style footer with minimal design', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    // Check for Auto-style footer container
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('auto-footer');
  });

  test('renders footer navigation links', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    // Check for Auto-style minimal navigation links
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Privacy')).toBeInTheDocument();
    expect(screen.getByText('Terms')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  test('renders copyright information with current year', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`AutoSphere © ${currentYear}`)).toBeInTheDocument();
  });

  test('renders region selector', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    expect(screen.getByText('🌍 Global')).toBeInTheDocument();
  });

  test('footer links have correct navigation paths', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const aboutLink = screen.getByText('About').closest('a');
    const contactLink = screen.getByText('Contact').closest('a');
    const privacyLink = screen.getByText('Privacy').closest('a');
    const termsLink = screen.getByText('Terms').closest('a');
    const supportLink = screen.getByText('Support').closest('a');

    expect(aboutLink).toHaveAttribute('href', '/about');
    expect(contactLink).toHaveAttribute('href', '/contact');
    expect(privacyLink).toHaveAttribute('href', '/privacy');
    expect(termsLink).toHaveAttribute('href', '/terms');
    expect(supportLink).toHaveAttribute('href', '/help');
  });

  test('footer has Auto-style CSS classes', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const footer = screen.getByRole('contentinfo');
    const footerContent = footer.querySelector('.auto-footer-content');
    const footerLinks = footer.querySelector('.auto-footer-links');
    const footerCopyright = footer.querySelector('.auto-footer-copyright');
    const footerRegion = footer.querySelector('.auto-footer-region');

    expect(footer).toHaveClass('auto-footer');
    expect(footerContent).toBeInTheDocument();
    expect(footerLinks).toBeInTheDocument();
    expect(footerCopyright).toBeInTheDocument();
    expect(footerRegion).toBeInTheDocument();
  });

  test('footer links have Auto-style CSS classes', () => {
    render(
      <FooterWrapper>
        <Footer />
      </FooterWrapper>
    );

    const aboutLink = screen.getByText('About').closest('a');
    expect(aboutLink).toHaveClass('auto-footer-link');
  });
});