import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import GaugeArc from '../../components/GaugeArc';
import PhoneCallButton from '../../components/PhoneCallButton';
import './ProviderSignup.css';

const STEPS = [
  'Business Details',
  'Contact Information',
  'Business Address',
  'Services Offered',
  'Verification Documents',
  'Payout Details',
  'Review & Email Verification',
];

export default function BusinessSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'service_provider',
    regNumber: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    primaryCategory: 'car_wash',
    description: '',
    bankName: '',
    accountNumber: '',
    otp: '',
  });

  const progress = (step + 1) / STEPS.length;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      next();
    } else {
      alert('Business Signup Request Submitted! Please check your email for verification.');
      navigate('/login');
    }
  };

  return (
    <div className="ps-container" style={{ padding: '40px 20px', maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
        <GaugeArc value={progress} size={150} />
        <h2 style={{ marginTop: '10px', fontSize: '1.4rem' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</h2>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>Service Provider & Dealer Operations Registration (Table 4.6.2)</p>
      </div>

      <div style={{ background: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <form onSubmit={handleSubmit}>
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>Business Name *</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} required placeholder="e.g., AutoSphere Motors & Service" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

              <label>Business Type *</label>
              <select name="businessType" value={formData.businessType} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="service_provider">Service Provider (Car Wash / Repair / Maintenance)</option>
                <option value="dealer">Vehicle Dealer</option>
              </select>

              <label>Registration Number</label>
              <input type="text" name="regNumber" value={formData.regNumber} onChange={handleChange} placeholder="e.g., BN-12345678" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>Contact Person Name *</label>
              <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} required placeholder="Full Name" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

              <label>Business Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="owner@business.com" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

              <label>Business Phone Number *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+233 24 123 4567" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              <PhoneCallButton phoneNumber={formData.phone} label="Verify Contact Phone" />
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>Street Address *</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="123 Commercial Ave" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

              <label>City *</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="Accra" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

              <label>State / Region</label>
              <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="Greater Accra" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>Primary Service Category *</label>
              <select name="primaryCategory" value={formData.primaryCategory} onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                <option value="car_wash">Car Wash & Detailing</option>
                <option value="maintenance">Maintenance & Oil Change</option>
                <option value="repair">Engine & Mechanical Repair</option>
                <option value="inspection">Vehicle Inspection</option>
              </select>

              <label>Description of Services Offered</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Describe your shop or dealership services..." style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          )}

          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: '#555' }}>Upload business registration certificate and government-issued ID of business owner.</p>
              <input type="file" multiple accept=".pdf,.jpg,.png" style={{ padding: '10px', background: '#f8f9fa', border: '1px dashed #aaa', borderRadius: '6px' }} />
            </div>
          )}

          {step === 5 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label>Bank Name / Payout Gateway</label>
              <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="GCB Bank / Mobile Money" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />

              <label>Account / Mobile Wallet Number</label>
              <input type="text" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="024XXXXXXX" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          )}

          {step === 6 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3>Review Business Details</h3>
              <p><strong>Business Name:</strong> {formData.businessName || '—'}</p>
              <p><strong>Contact Email:</strong> {formData.email || '—'}</p>
              <p><strong>Contact Phone:</strong> {formData.phone || '—'}</p>
              <p><strong>Category:</strong> Car Wash / Maintenance</p>
              <hr />
              <label>Enter Email OTP Verification Code</label>
              <input type="text" name="otp" value={formData.otp} onChange={handleChange} placeholder="Enter 6-digit OTP code" style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
            {step > 0 ? (
              <button type="button" onClick={back} style={{ padding: '10px 20px', background: '#eee', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Back
              </button>
            ) : <div />}

            <button type="submit" style={{ padding: '10px 24px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              {step === STEPS.length - 1 ? 'Verify Email & Complete Registration' : 'Continue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
