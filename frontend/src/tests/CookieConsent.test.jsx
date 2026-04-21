/**
 * CookieConsent — end-to-end component tests
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CookieConsent from '../components/CookieConsent';

const STORAGE_KEY = 'autosphere_cookie_consent';

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows banner when no consent is stored', () => {
    render(<CookieConsent />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/we use cookies/i)).toBeInTheDocument();
  });

  it('hides banner when consent already stored', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ functional: true }));
    render(<CookieConsent />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Accept All saves all consents and hides banner', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByRole('button', { name: /accept all/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.functional).toBe(true);
    expect(saved.analytics).toBe(true);
    expect(saved.marketing).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Reject All saves only functional and hides banner', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByRole('button', { name: /reject all/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.functional).toBe(true);
    expect(saved.analytics).toBe(false);
    expect(saved.marketing).toBe(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Manage Preferences shows detail checkboxes', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByRole('button', { name: /manage preferences/i }));

    expect(screen.getByText(/analytics/i)).toBeInTheDocument();
    expect(screen.getByText(/marketing/i)).toBeInTheDocument();
  });

  it('Save Preferences saves custom choices', async () => {
    render(<CookieConsent />);
    await userEvent.click(screen.getByRole('button', { name: /manage preferences/i }));

    // Toggle analytics on
    const analyticsCheckbox = screen.getAllByRole('checkbox').find(
      cb => !cb.disabled && cb.closest('label')?.textContent?.includes('Analytics')
    );
    if (analyticsCheckbox) await userEvent.click(analyticsCheckbox);

    await userEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.functional).toBe(true);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has a link to the privacy policy', () => {
    render(<CookieConsent />);
    const link = screen.getByText(/privacy policy/i);
    expect(link.closest('a')).toHaveAttribute('href', '/privacy-policy');
  });
});
