/**
 * ProviderSignup — Enhanced multi-step registration for Service Providers & Dealers
 *
 * Steps:
 *  0  Role selection (service_provider | dealer)
 *  1  Personal info
 *  2  Business info
 *  3  Identity verification
 *  4  Payment info
 *  5  Security (password)
 *  6  Legal agreement
 */
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig.js';
import './ProviderSignup.css';

// ─── constants ────────────────────────────────────────────────────────────────

const STEPS = [
  'Role',
  'Personal Info',
  'Business Info',
  'Identity',
  'Payment',
  'Security',
  'Agreement',
];

const SERVICE_TYPES = [
  'Mechanic / Auto Repair',
  'Car Wash & Detailing',
  'Tire Service',
  'Electrical / Electronics',
  'Body Shop / Panel Beating',
  'Oil & Lubrication',
  'Towing Service',
  'Vehicle Inspection',
  'AC & Cooling Systems',
  'General Maintenance',
  'Car Dealer',
  'Other',
];

const COUNTRIES = ['Ghana', 'Nigeria', 'Kenya', 'South Africa', 'Other'];

// ─── helpers ──────────────────────────────────────────────────────────────────

const passwordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak',   color: '#e53935', pct: 20 };
  if (score === 2) return { label: 'Fair',   color: '#fb8c00', pct: 40 };
  if (score === 3) return { label: 'Good',   color: '#fdd835', pct: 65 };
  if (score === 4) return { label: 'Strong', color: '#43a047', pct: 85 };
  return              { label: 'Very Strong', color: '#1b5e20', pct: 100 };
};

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, required, hint, error, children }) => (
  <div className="ps-field">
    {label && (
      <label>
        {label} {required && <span className="ps-required">*</span>}
      </label>
    )}
    {children}
    {hint  && !error && <span className="ps-hint">{hint}</span>}
    {error && <span className="ps-err">{error}</span>}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProviderSignup() {
  const navigate = useNavigate();
  const idFileRef   = useRef(null);
  const selfieRef   = useRef(null);

  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [done, setDone]       = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // ── form state ─────────────────────────────────────────────────────────────
  const [role, setRole]       = useState('');          // service_provider | dealer
  const [errors, setErrors]   = useState({});
  const [showPw,  setShowPw]  = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const [personal, setPersonal] = useState({
    firstName: '', lastName: '', phone: '', email: '', address: '',
  });

  const [business, setBusiness] = useState({
    businessName: '', serviceType: '', location: '', country: 'Ghana',
    yearsOfExperience: '', businessDescription: '',
  });

  const [identity, setIdentity] = useState({
    idType: 'national_id',   // national_id | passport
    idNumber: '',
    idFile: null,
    selfieFile: null,
  });

  const [payment, setPayment] = useState({
    paymentMethod: 'mobile_money',   // mobile_money | bank
    mobileMoneyNumber: '',
    mobileMoneyNetwork: 'MTN',
    bankName: '', bankAccount: '', bankBranch: '',
  });

  const [security, setSecurity] = useState({ password: '', confirmPassword: '' });

  const [legal, setLegal] = useState({
    acceptTerms: false, acceptPrivacy: false, acceptVerification: false,
  });

  // ── field setters ──────────────────────────────────────────────────────────
  const setP = (k, v) => { setPersonal(p => ({ ...p, [k]: v })); clearErr(k); };
  const setB = (k, v) => { setBusiness(p => ({ ...p, [k]: v })); clearErr(k); };
  const setI = (k, v) => { setIdentity(p => ({ ...p, [k]: v })); clearErr(k); };
  const setPay = (k, v) => { setPayment(p => ({ ...p, [k]: v })); clearErr(k); };
  const setS = (k, v) => { setSecurity(p => ({ ...p, [k]: v })); clearErr(k); };
  const setL = (k, v) => { setLegal(p => ({ ...p, [k]: v })); clearErr(k); };
  const clearErr = (k) => setErrors(e => ({ ...e, [k]: '' }));

  // ── validation per step ────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (step === 0) {
      if (!role) errs.role = 'Please select a role to continue.';
    }
    if (step === 1) {
      if (!personal.firstName.trim())  errs.firstName = 'First name is required.';
      if (!personal.lastName.trim())   errs.lastName  = 'Last name is required.';
      if (!personal.phone.trim())      errs.phone     = 'Phone number is required.';
      else if (!/^\+?[\d\s\-()\u0020]{10,}$/.test(personal.phone))
        errs.phone = 'Enter a valid phone number (min 10 digits).';
      if (!personal.email.trim())      errs.email     = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(personal.email))
        errs.email = 'Enter a valid email address.';
      if (!personal.address.trim())    errs.address   = 'Address is required.';
    }
    if (step === 2) {
      if (!business.businessName.trim()) errs.businessName  = 'Business name is required.';
      if (!business.serviceType)         errs.serviceType   = 'Service type is required.';
      if (!business.location.trim())     errs.location      = 'Location is required.';
      if (!business.yearsOfExperience)   errs.yearsOfExperience = 'Years of experience is required.';
      else if (isNaN(business.yearsOfExperience) || +business.yearsOfExperience < 0)
        errs.yearsOfExperience = 'Enter a valid number.';
    }
    if (step === 3) {
      if (!identity.idNumber.trim()) errs.idNumber = 'ID / Passport number is required.';
      if (!identity.idFile)          errs.idFile   = 'Please upload your ID document.';
    }
    if (step === 4) {
      if (payment.paymentMethod === 'mobile_money') {
        if (!payment.mobileMoneyNumber.trim())
          errs.mobileMoneyNumber = 'Mobile money number is required.';
        else if (!/^\+?[\d\s]{10,}$/.test(payment.mobileMoneyNumber))
          errs.mobileMoneyNumber = 'Enter a valid mobile money number.';
      } else {
        if (!payment.bankName.trim())    errs.bankName    = 'Bank name is required.';
        if (!payment.bankAccount.trim()) errs.bankAccount = 'Account number is required.';
      }
    }
    if (step === 5) {
      if (!security.password)             errs.password = 'Password is required.';
      else if (security.password.length < 8)
        errs.password = 'Password must be at least 8 characters.';
      else if (!/(?=.*[A-Z])(?=.*[0-9])/.test(security.password))
        errs.password = 'Must contain at least one uppercase letter and one number.';
      if (!security.confirmPassword)      errs.confirmPassword = 'Please confirm your password.';
      else if (security.password !== security.confirmPassword)
        errs.confirmPassword = 'Passwords do not match.';
    }
    if (step === 6) {
      if (!legal.acceptTerms)        errs.acceptTerms        = 'You must accept the Terms & Conditions.';
      if (!legal.acceptPrivacy)      errs.acceptPrivacy      = 'You must accept the Privacy Policy.';
      if (!legal.acceptVerification) errs.acceptVerification = 'You must consent to identity verification.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── navigation ─────────────────────────────────────────────────────────────
  const goNext = () => { if (validate()) { setApiError(''); setStep(s => s + 1); } };
  const goBack = () => { setApiError(''); setStep(s => s - 1); };

  // ── submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const formData = new FormData();

      // core auth fields
      formData.append('email',     personal.email.trim().toLowerCase());
      formData.append('password',  security.password);
      formData.append('firstName', personal.firstName.trim());
      formData.append('lastName',  personal.lastName.trim());
      formData.append('phone',     personal.phone.trim());
      formData.append('role',      role);

      // personal
      formData.append('address', personal.address.trim());

      // business
      formData.append('businessName',        business.businessName.trim());
      formData.append('businessType',        business.serviceType);
      formData.append('businessDescription', business.businessDescription.trim());
      formData.append('location',            business.location.trim());
      formData.append('country',             business.country);
      formData.append('yearsOfExperience',   business.yearsOfExperience);

      // identity
      formData.append('idType',   identity.idType);
      formData.append('idNumber', identity.idNumber.trim());
      if (identity.idFile)     formData.append('idDocument', identity.idFile);
      if (identity.selfieFile) formData.append('selfie',     identity.selfieFile);

      // payment
      formData.append('paymentMethod', payment.paymentMethod);
      if (payment.paymentMethod === 'mobile_money') {
        formData.append('mobileMoneyNumber',  payment.mobileMoneyNumber.trim());
        formData.append('mobileMoneyNetwork', payment.mobileMoneyNetwork);
      } else {
        formData.append('bankName',    payment.bankName.trim());
        formData.append('bankAccount', payment.bankAccount.trim());
        formData.append('bankBranch',  payment.bankBranch.trim());
      }

      // legal
      formData.append('acceptTerms',        legal.acceptTerms);
      formData.append('acceptPrivacy',      legal.acceptPrivacy);
      formData.append('acceptVerification', legal.acceptVerification);

      const res = await axios.post('/api/auth/register-provider', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setRegisteredEmail(personal.email.trim().toLowerCase());
        setDone(true);
      } else {
        setApiError(res.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
        'Registration failed. Please check your details and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── success screen ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="ps-page">
        <div className="ps-card">
          <div className="ps-body">
            <div className="ps-success-wrap">
              <div className="ps-success-icon">✅</div>
              <h2>Registration Submitted!</h2>
              <p>
                We've sent a 6-digit verification code to <strong>{registeredEmail}</strong>.
                Enter it to activate your account.
              </p>
              <button
                className="ps-btn primary"
                onClick={() => navigate('/verify-email', {
                  state: { email: registeredEmail, fromRegistration: true },
                })}
              >
                Enter Verification Code →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const pwStr = security.password ? passwordStrength(security.password) : null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ps-page">
      <div className="ps-card">

        {/* Header */}
        <div className="ps-header">
          <h1>🔐 Provider / Dealer Registration</h1>
          <p>Complete all steps to create your verified business account on AutoSphere.</p>
        </div>

        {/* Step bar */}
        <div className="ps-steps">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`ps-step ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`}
            >
              {i > 0 && <div className="ps-step-line" />}
              <div className="ps-step-circle">{i < step ? '✓' : i + 1}</div>
              <span className="ps-step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="ps-body">

          {apiError && <div className="ps-alert error">{apiError}</div>}

          {/* ── STEP 0: Role ── */}
          {step === 0 && (
            <>
              <div className="ps-section-title">👤 Choose Your Account Type</div>
              <div className="ps-role-grid">
                <div
                  className={`ps-role-card ${role === 'service_provider' ? 'selected' : ''}`}
                  onClick={() => { setRole('service_provider'); clearErr('role'); }}
                >
                  <div className="ps-role-icon">🔧</div>
                  <div className="ps-role-name">Service Provider</div>
                  <div className="ps-role-desc">
                    Mechanic, car wash, tire shop, diagnostics, or any automotive service business.
                  </div>
                </div>
                <div
                  className={`ps-role-card ${role === 'dealer' ? 'selected' : ''}`}
                  onClick={() => { setRole('dealer'); clearErr('role'); }}
                >
                  <div className="ps-role-icon">🚗</div>
                  <div className="ps-role-name">Car Dealer</div>
                  <div className="ps-role-desc">
                    List and sell vehicles, manage inventory, and connect with buyers.
                  </div>
                </div>
              </div>
              {errors.role && <p className="ps-err" style={{ marginTop: 12 }}>{errors.role}</p>}

              <div className="ps-spacer" />

              {/* Security info */}
              <div className="ps-section-title">🔒 How We Keep Your Account Secure</div>
              <div className="ps-security-list">
                <div className="ps-security-item"><span>✉️</span> Email OTP verification after registration</div>
                <div className="ps-security-item"><span>🔑</span> Strong password requirement (8+ chars, uppercase, number)</div>
                <div className="ps-security-item"><span>🪪</span> Government ID verification before account activation</div>
                <div className="ps-security-item"><span>👮</span> Admin review before your profile goes live</div>
                <div className="ps-security-item"><span>🔒</span> All data encrypted in transit and at rest</div>
              </div>

              <div className="ps-spacer" />
              <p style={{ textAlign: 'center', fontSize: '.875rem', color: '#6b7280' }}>
                Registering as a customer?{' '}
                <Link to="/register" style={{ color: '#1976d2' }}>Use the standard signup</Link>
              </p>
            </>
          )}

          {/* ── STEP 1: Personal info ── */}
          {step === 1 && (
            <>
              <div className="ps-section-title">👤 Personal Information</div>
              <div className="ps-grid ps-grid-2">
                <Field label="First Name" required error={errors.firstName}>
                  <input
                    value={personal.firstName}
                    onChange={e => setP('firstName', e.target.value)}
                    placeholder="e.g. Kwame"
                    className={errors.firstName ? 'error' : ''}
                  />
                </Field>
                <Field label="Last Name" required error={errors.lastName}>
                  <input
                    value={personal.lastName}
                    onChange={e => setP('lastName', e.target.value)}
                    placeholder="e.g. Mensah"
                    className={errors.lastName ? 'error' : ''}
                  />
                </Field>
                <Field
                  label="Phone Number" required
                  hint="Used for OTP verification and customer contact"
                  error={errors.phone}
                >
                  <input
                    type="tel"
                    value={personal.phone}
                    onChange={e => setP('phone', e.target.value)}
                    placeholder="+233 20 000 0000"
                    className={errors.phone ? 'error' : ''}
                  />
                </Field>
                <Field
                  label="Email Address" required
                  hint="A verification code will be sent here"
                  error={errors.email}
                >
                  <input
                    type="email"
                    value={personal.email}
                    onChange={e => setP('email', e.target.value)}
                    placeholder="you@example.com"
                    className={errors.email ? 'error' : ''}
                  />
                </Field>
              </div>
              <div className="ps-spacer" style={{ height: 12 }} />
              <div className="ps-grid ps-grid-1">
                <Field label="Home / Business Address" required error={errors.address}>
                  <input
                    value={personal.address}
                    onChange={e => setP('address', e.target.value)}
                    placeholder="Street address, city"
                    className={errors.address ? 'error' : ''}
                  />
                </Field>
              </div>
            </>
          )}

          {/* ── STEP 2: Business info ── */}
          {step === 2 && (
            <>
              <div className="ps-section-title">🏢 Business Information</div>
              <div className="ps-grid ps-grid-2">
                <Field label="Business Name" required error={errors.businessName}>
                  <input
                    value={business.businessName}
                    onChange={e => setB('businessName', e.target.value)}
                    placeholder="e.g. Kwame Auto Services"
                    className={errors.businessName ? 'error' : ''}
                  />
                </Field>
                <Field label="Service / Business Type" required error={errors.serviceType}>
                  <select
                    value={business.serviceType}
                    onChange={e => setB('serviceType', e.target.value)}
                    className={errors.serviceType ? 'error' : ''}
                  >
                    <option value="">Select type…</option>
                    {SERVICE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Business Location" required error={errors.location}>
                  <input
                    value={business.location}
                    onChange={e => setB('location', e.target.value)}
                    placeholder="e.g. Accra, Tema, Kumasi"
                    className={errors.location ? 'error' : ''}
                  />
                </Field>
                <Field label="Country" required>
                  <select value={business.country} onChange={e => setB('country', e.target.value)}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field
                  label="Years of Experience" required
                  error={errors.yearsOfExperience}
                >
                  <input
                    type="number" min="0" max="80"
                    value={business.yearsOfExperience}
                    onChange={e => setB('yearsOfExperience', e.target.value)}
                    placeholder="e.g. 5"
                    className={errors.yearsOfExperience ? 'error' : ''}
                  />
                </Field>
              </div>
              <div className="ps-spacer" style={{ height: 12 }} />
              <Field label="Business Description" hint="Briefly describe your services (optional)">
                <textarea
                  rows={3}
                  value={business.businessDescription}
                  onChange={e => setB('businessDescription', e.target.value)}
                  placeholder="e.g. We specialise in brake services and oil changes for all vehicle types…"
                />
              </Field>
            </>
          )}

          {/* ── STEP 3: Identity Verification ── */}
          {step === 3 && (
            <>
              <div className="ps-section-title">🪪 Identity Verification</div>
              <div className="ps-grid ps-grid-2">
                <Field label="ID Type" required>
                  <select value={identity.idType} onChange={e => setI('idType', e.target.value)}>
                    <option value="national_id">National ID Card</option>
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's Licence</option>
                    <option value="voter_id">Voter ID</option>
                  </select>
                </Field>
                <Field
                  label="ID / Passport Number" required
                  error={errors.idNumber}
                >
                  <input
                    value={identity.idNumber}
                    onChange={e => setI('idNumber', e.target.value)}
                    placeholder="Enter your ID number"
                    className={errors.idNumber ? 'error' : ''}
                  />
                </Field>
              </div>

              <div className="ps-spacer" style={{ height: 12 }} />

              {/* ID document upload */}
              <Field label="Upload ID Document" required error={errors.idFile}
                hint="Accepted: JPG, PNG, PDF — max 5 MB">
                <div
                  className={`ps-upload ${identity.idFile ? 'has-file' : ''}`}
                  onClick={() => idFileRef.current?.click()}
                >
                  <input
                    ref={idFileRef} type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setI('idFile', file);
                    }}
                  />
                  <div className="ps-upload-icon">
                    {identity.idFile ? '✅' : '📄'}
                  </div>
                  <p>
                    {identity.idFile
                      ? identity.idFile.name
                      : <><strong>Click to upload</strong> your ID document</>}
                  </p>
                </div>
              </Field>

              <div className="ps-spacer" style={{ height: 16 }} />

              {/* Selfie — optional */}
              <Field label="Selfie with ID (Optional)"
                hint="A photo of you holding your ID helps speed up verification">
                <div
                  className={`ps-upload ${identity.selfieFile ? 'has-file' : ''}`}
                  onClick={() => selfieRef.current?.click()}
                >
                  <input
                    ref={selfieRef} type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={e => {
                      const file = e.target.files?.[0] || null;
                      setI('selfieFile', file);
                    }}
                  />
                  <div className="ps-upload-icon">
                    {identity.selfieFile ? '✅' : '🤳'}
                  </div>
                  <p>
                    {identity.selfieFile
                      ? identity.selfieFile.name
                      : <><strong>Click to upload</strong> selfie (optional)</>}
                  </p>
                </div>
              </Field>
            </>
          )}

          {/* ── STEP 4: Payment Info ── */}
          {step === 4 && (
            <>
              <div className="ps-section-title">💳 Payment Information</div>
              <Field label="Payment Method" required>
                <select
                  value={payment.paymentMethod}
                  onChange={e => setPay('paymentMethod', e.target.value)}
                >
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank">Bank Account</option>
                </select>
              </Field>

              <div className="ps-spacer" style={{ height: 16 }} />

              {payment.paymentMethod === 'mobile_money' ? (
                <div className="ps-grid ps-grid-2">
                  <Field label="Mobile Money Number" required error={errors.mobileMoneyNumber}>
                    <input
                      type="tel"
                      value={payment.mobileMoneyNumber}
                      onChange={e => setPay('mobileMoneyNumber', e.target.value)}
                      placeholder="+233 20 000 0000"
                      className={errors.mobileMoneyNumber ? 'error' : ''}
                    />
                  </Field>
                  <Field label="Network" required>
                    <select
                      value={payment.mobileMoneyNetwork}
                      onChange={e => setPay('mobileMoneyNetwork', e.target.value)}
                    >
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="Vodafone">Vodafone Cash</option>
                      <option value="AirtelTigo">AirtelTigo Money</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>
              ) : (
                <div className="ps-grid ps-grid-2">
                  <Field label="Bank Name" required error={errors.bankName}>
                    <input
                      value={payment.bankName}
                      onChange={e => setPay('bankName', e.target.value)}
                      placeholder="e.g. GCB Bank"
                      className={errors.bankName ? 'error' : ''}
                    />
                  </Field>
                  <Field label="Account Number" required error={errors.bankAccount}>
                    <input
                      value={payment.bankAccount}
                      onChange={e => setPay('bankAccount', e.target.value)}
                      placeholder="Enter account number"
                      className={errors.bankAccount ? 'error' : ''}
                    />
                  </Field>
                  <Field label="Branch (optional)">
                    <input
                      value={payment.bankBranch}
                      onChange={e => setPay('bankBranch', e.target.value)}
                      placeholder="e.g. Accra Main"
                    />
                  </Field>
                </div>
              )}

              <div className="ps-spacer" />
              <div className="ps-security-list">
                <div className="ps-security-item">
                  <span>🔒</span> Your payment details are encrypted and only used for payouts.
                </div>
                <div className="ps-security-item">
                  <span>🛡️</span> We never charge your account — this is for receiving payments only.
                </div>
              </div>
            </>
          )}

          {/* ── STEP 5: Security / Password ── */}
          {step === 5 && (
            <>
              <div className="ps-section-title">🔑 Create a Strong Password</div>

              <div className="ps-grid ps-grid-1">
                <Field
                  label="Password" required
                  error={errors.password}
                  hint="At least 8 characters with one uppercase letter and one number"
                >
                  <div className="ps-pw-wrap">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={security.password}
                      onChange={e => setS('password', e.target.value)}
                      placeholder="Create a strong password"
                      className={errors.password ? 'error' : ''}
                      autoComplete="new-password"
                    />
                    <button type="button" className="ps-pw-toggle" onClick={() => setShowPw(v => !v)}>
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {security.password && pwStr && (
                    <div className="ps-pw-strength">
                      <div className="ps-pw-strength-bar">
                        <div
                          className="ps-pw-strength-fill"
                          style={{ width: `${pwStr.pct}%`, background: pwStr.color }}
                        />
                      </div>
                      <span className="ps-pw-strength-label" style={{ color: pwStr.color }}>
                        {pwStr.label}
                      </span>
                    </div>
                  )}
                </Field>

                <Field label="Confirm Password" required error={errors.confirmPassword}>
                  <div className="ps-pw-wrap">
                    <input
                      type={showCpw ? 'text' : 'password'}
                      value={security.confirmPassword}
                      onChange={e => setS('confirmPassword', e.target.value)}
                      placeholder="Repeat your password"
                      className={errors.confirmPassword ? 'error' : ''}
                      autoComplete="new-password"
                    />
                    <button type="button" className="ps-pw-toggle" onClick={() => setShowCpw(v => !v)}>
                      {showCpw ? '🙈' : '👁️'}
                    </button>
                  </div>
                </Field>
              </div>

              <div className="ps-spacer" />
              <div className="ps-security-list">
                <div className="ps-security-item"><span>✉️</span> Email OTP verification will be required after registration</div>
                <div className="ps-security-item"><span>📱</span> Phone OTP may be requested for sensitive actions</div>
                <div className="ps-security-item"><span>🔐</span> Never share your password with anyone</div>
              </div>
            </>
          )}

          {/* ── STEP 6: Legal Agreement ── */}
          {step === 6 && (
            <>
              <div className="ps-section-title">📜 Legal Agreement</div>
              <p style={{ color: '#6b7280', fontSize: '.9rem', marginTop: 0 }}>
                Please read and accept the following before submitting your application.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div className="ps-check-row">
                    <input
                      type="checkbox" id="terms"
                      checked={legal.acceptTerms}
                      onChange={e => setL('acceptTerms', e.target.checked)}
                    />
                    <label htmlFor="terms">
                      I accept the{' '}
                      <Link to="/privacy-policy" target="_blank">Terms &amp; Conditions</Link>
                      {' '}of AutoSphere, including the provider service agreement and fee structure.
                    </label>
                  </div>
                  {errors.acceptTerms && <p className="ps-err" style={{ marginLeft: 14 }}>{errors.acceptTerms}</p>}
                </div>

                <div>
                  <div className="ps-check-row">
                    <input
                      type="checkbox" id="privacy"
                      checked={legal.acceptPrivacy}
                      onChange={e => setL('acceptPrivacy', e.target.checked)}
                    />
                    <label htmlFor="privacy">
                      I accept the{' '}
                      <Link to="/privacy-policy" target="_blank">Privacy Policy</Link>
                      {' '}and consent to the collection and processing of my personal data for account management.
                    </label>
                  </div>
                  {errors.acceptPrivacy && <p className="ps-err" style={{ marginLeft: 14 }}>{errors.acceptPrivacy}</p>}
                </div>

                <div>
                  <div className="ps-check-row">
                    <input
                      type="checkbox" id="verification"
                      checked={legal.acceptVerification}
                      onChange={e => setL('acceptVerification', e.target.checked)}
                    />
                    <label htmlFor="verification">
                      I consent to identity verification and understand that my account will be reviewed
                      by the AutoSphere team before going live.
                    </label>
                  </div>
                  {errors.acceptVerification && <p className="ps-err" style={{ marginLeft: 14 }}>{errors.acceptVerification}</p>}
                </div>
              </div>

              <div className="ps-spacer" />
              <div className="ps-security-list">
                <div className="ps-security-item"><span>🛡️</span> Your documents are reviewed securely by our compliance team</div>
                <div className="ps-security-item"><span>⏱️</span> Account review typically takes 24–48 hours</div>
                <div className="ps-security-item"><span>📧</span> You'll receive an email confirmation once approved</div>
              </div>
            </>
          )}

        </div>{/* end ps-body */}

        {/* Navigation */}
        <div className="ps-nav">
          {step > 0 && (
            <button className="ps-btn secondary" onClick={goBack} disabled={loading}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="ps-btn primary" onClick={goNext}>
              Continue →
            </button>
          ) : (
            <button className="ps-btn primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting…' : '✅ Submit Registration'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
