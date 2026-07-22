/**
 * EmailVerificationForm — OTP verification screen shown after registration
 * or when a user tries to log in with an unverified account.
 *
 * Accepts state: { email, fromRegistration, fromLogin }
 * Also handles legacy ?token= links for backward compatibility.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/axiosConfig.js';
import './EmailVerificationForm.css';

const RESEND_COOLDOWN = 60; // seconds

const EmailVerificationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, googleLogin } = useAuth();

  // Email comes from navigation state (post-register/login) or query param
  const stateEmail = location.state?.email || '';
  const [email, setEmail] = useState(stateEmail);
  const [emailInput, setEmailInput] = useState(stateEmail); // editable if not pre-filled

  // 6 individual digit inputs
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
  const [message, setMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMsg, setResendMsg] = useState('');
  const cooldownRef = useRef(null);

  // Handle legacy ?token= link (old email-link flow)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Auto-verify via old token endpoint
      axios.post('/api/auth/verify-email', { token })
        .then(res => {
          setStatus('success');
          setMessage(res.data.message || 'Email verified! You can now sign in.');
        })
        .catch(err => {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
        });
    }
  }, [searchParams]);

  // Start resend cooldown
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Auto-start cooldown on mount (code was just sent)
  useEffect(() => {
    if (stateEmail) startCooldown();
    return () => clearInterval(cooldownRef.current);
  }, []);

  // Focus first input on mount
  useEffect(() => {
    if (!searchParams.get('token')) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, []);

  const handleDigitChange = (index, value) => {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const code = [...next].join('');
      if (code.length === 6) handleVerify(code);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, 5);
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === 6) handleVerify(pasted);
  };

  const handleVerify = async (codeOverride) => {
    const targetEmail = email || emailInput;
    const code = codeOverride || digits.join('');
    if (!targetEmail || code.length < 6) return;

    setStatus('submitting');
    setMessage('');
    try {
      const res = await axios.post('/api/auth/verify-otp', { email: targetEmail, otp: code });
      // Use googleLogin (same signature: user + token + refreshToken) to properly update AuthContext state
      if (res.data.token && res.data.user) {
        await googleLogin(res.data.user, res.data.token, res.data.refreshToken || null);
      }
      setStatus('success');
      setMessage(res.data.message || 'Email verified!');
      // Redirect to the right dashboard after a short pause
      setTimeout(() => {
        const role = res.data.user?.role;
        const dest = role === 'dealer' ? '/dealer-dashboard'
          : role === 'service_provider' ? '/service-provider-dashboard'
          : role === 'admin' ? '/admin-dashboard'
          : '/dashboard';
        navigate(dest, { replace: true });
      }, 1500);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.message || 'Incorrect code. Please try again.');
      // Clear digits on error
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  };

  const handleResend = async () => {
    const targetEmail = email || emailInput;
    if (!targetEmail || resendCooldown > 0) return;
    setResendMsg('');
    try {
      await axios.post('/api/auth/resend-otp', { email: targetEmail });
      setResendMsg('A new code has been sent to your email.');
      setDigits(['', '', '', '', '', '']);
      setStatus('idle');
      setMessage('');
      startCooldown();
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Failed to resend. Please try again.');
    }
  };

  const otp = digits.join('');
  const isLegacyToken = Boolean(searchParams.get('token'));

  // ── Legacy token view ──────────────────────────────────────────────────────
  if (isLegacyToken) {
    return (
      <div className="evf-page">
        <div className="evf-card">
          <div className="evf-logo">AutoSphere</div>
          {status === 'idle' && (
            <div className="evf-spinner-wrap">
              <span className="evf-spinner" />
              <p>Verifying your email…</p>
            </div>
          )}
          {status === 'success' && (
            <>
              <div className="evf-icon success">✓</div>
              <h2>Email Verified!</h2>
              <p className="evf-sub">{message}</p>
              <Link to="/login" className="evf-btn-primary">Continue to Sign In</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="evf-icon error">✕</div>
              <h2>Verification Failed</h2>
              <p className="evf-sub evf-error">{message}</p>
              <Link to="/login" className="evf-btn-secondary">Back to Sign In</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── OTP entry view ─────────────────────────────────────────────────────────
  return (
    <div className="evf-page">
      <div className="evf-card">
        <div className="evf-logo">AutoSphere</div>

        {status === 'success' ? (
          <>
            <div className="evf-icon success">✓</div>
            <h2>Email Verified!</h2>
            <p className="evf-sub">{message}</p>
            <p className="evf-sub" style={{ color: '#8696a0' }}>Redirecting you to your dashboard…</p>
          </>
        ) : (
          <>
            <div className="evf-icon email">✉</div>
            <h2>Check your email</h2>
            <p className="evf-sub">
              We sent a 6-digit code to{' '}
              <strong>{email || emailInput || 'your email'}</strong>.
              Enter it below to verify your account.
            </p>

            {/* Email input — only shown if not pre-filled */}
            {!email && (
              <div className="evf-field">
                <label>Email address</label>
                <input
                  type="email"
                  className="evf-email-input"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                />
              </div>
            )}

            {/* 6-digit OTP inputs */}
            <div className="evf-otp-row" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`evf-otp-input ${status === 'error' ? 'error' : ''}`}
                  value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  aria-label={`Digit ${i + 1}`}
                  autoComplete="one-time-code"
                  disabled={status === 'submitting'}
                />
              ))}
            </div>

            {/* Error message */}
            {status === 'error' && message && (
              <p className="evf-error-msg">{message}</p>
            )}

            {/* Verify button */}
            <button
              className="evf-btn-primary"
              onClick={() => handleVerify()}
              disabled={otp.length < 6 || status === 'submitting' || (!email && !emailInput)}
            >
              {status === 'submitting' ? (
                <><span className="evf-spinner small" /> Verifying…</>
              ) : 'Verify Email'}
            </button>

            {/* Resend */}
            <div className="evf-resend">
              {resendMsg && (
                <p className={`evf-resend-msg ${resendMsg.includes('sent') ? 'success' : 'error'}`}>
                  {resendMsg}
                </p>
              )}
              <p>
                Didn't receive a code?{' '}
                {resendCooldown > 0 ? (
                  <span className="evf-cooldown">Resend in {resendCooldown}s</span>
                ) : (
                  <button className="evf-resend-btn" onClick={handleResend}>
                    Resend code
                  </button>
                )}
              </p>
            </div>

            <div className="evf-back">
              <Link to="/login">← Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerificationForm;
