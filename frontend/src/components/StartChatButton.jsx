/**
 * StartChatButton — drop this anywhere to let the current user
 * open a conversation with another user (dealer, service provider, etc.)
 *
 * Usage:
 *   <StartChatButton userId={dealer.id} userName="John Smith" />
 *   <StartChatButton userId={provider.id} userName="AutoFix Ltd" userRole="dealer" label="Message Provider" />
 *
 * With reference card (vehicle or service):
 *   <StartChatButton
 *     userId={dealer.id} userName="John Smith" userRole="dealer"
 *     reference={{
 *       type: 'vehicle',           // 'vehicle' | 'service' | 'rental'
 *       id: vehicle.id,
 *       title: '2022 Toyota Camry',
 *       subtitle: 'GH₵ 145,900 · Used · Automatic',
 *       image: vehicle.images?.[0],
 *     }}
 *   />
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';
import './StartChatButton.css';

const ROLE_LABELS = {
  dealer:           'Dealer',
  service_provider: 'Service Provider',
  user:             'Customer',
  admin:            'Admin',
};

const REF_ICONS = {
  vehicle: '🚗',
  rental:  '🔑',
  service: '🔧',
};

const StartChatButton = ({
  userId,
  userName = 'this person',
  userRole = '',
  userPhone = '',
  label = 'Message',
  icon = '💬',
  variant = 'primary',
  size = 'md',
  className = '',
  // Reference card — vehicle / service / rental being enquired about
  reference = null,   // { type, id, title, subtitle, image }
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [error, setError] = useState('');

  // Build a default opening message when a reference is present
  const defaultText = reference
    ? reference.type === 'vehicle' || reference.type === 'rental'
      ? `Hi, I'm interested in the ${reference.title}. Could you please give me more details?`
      : `Hi, I'd like to enquire about your ${reference.title} service.`
    : '';

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    setShowModal(true);
    setMsgText(defaultText);
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setLoading(true);
    setError('');
    try {
      // The reference (vehicle / service / rental) is attached as structured
      // metadata and rendered as a story card in the chat thread — no need to
      // duplicate it as a text prefix.
      const finalMessage = msgText.trim();

      const res = await messageAPI.startConversation(userId, finalMessage, {
        relatedVehicleId: reference?.type === 'vehicle' || reference?.type === 'rental'
          ? reference.id
          : undefined,
        reference,
      });
      if (res.data.success) {
        setShowModal(false);
        navigate('/user-messages');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = ROLE_LABELS[userRole] || '';

  return (
    <>
      <button
        className={`scb-btn scb-${variant} scb-${size} ${className}`}
        onClick={handleClick}
        aria-label={`Message ${userName}`}
      >
        <span className="scb-icon">{icon}</span>
        {label}
      </button>

      {showModal && (
        <div
          className="scb-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="scb-modal">
            {/* Header — recipient info */}
            <div className="scb-modal-header">
              <div className="scb-modal-title">
                <div className="scb-modal-avatar">
                  {userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h3>{userName}</h3>
                  <div className="scb-modal-meta">
                    {roleLabel && (
                      <span className={`scb-role-badge scb-role-${userRole}`}>
                        {roleLabel}
                      </span>
                    )}
                    {userPhone && (
                      <a
                        href={`tel:${userPhone.replace(/[\s\-().]/g, '')}`}
                        className="scb-phone-link"
                        onClick={e => e.stopPropagation()}
                      >
                        📞 {userPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <button className="scb-close" onClick={() => setShowModal(false)} aria-label="Close">✕</button>
            </div>

            <form onSubmit={handleSend}>
              <div className="scb-modal-body">

                {/* Reference card */}
                {reference && (
                  <div className="scb-ref-card">
                    {reference.image && (
                      <img
                        src={reference.image}
                        alt={reference.title}
                        className="scb-ref-img"
                      />
                    )}
                    {!reference.image && (
                      <div className="scb-ref-icon-box">
                        {REF_ICONS[reference.type] || '📎'}
                      </div>
                    )}
                    <div className="scb-ref-info">
                      <div className="scb-ref-type">
                        {REF_ICONS[reference.type]} {reference.type === 'rental' ? 'Rental Enquiry' : reference.type === 'service' ? 'Service Enquiry' : 'Vehicle Enquiry'}
                      </div>
                      <div className="scb-ref-title">{reference.title}</div>
                      {reference.subtitle && (
                        <div className="scb-ref-subtitle">{reference.subtitle}</div>
                      )}
                    </div>
                  </div>
                )}

                <textarea
                  className="scb-textarea"
                  placeholder={`Write a message to ${userName}…`}
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  rows={4}
                  autoFocus
                  required
                />
                {error && <p className="scb-error">{error}</p>}
              </div>

              <div className="scb-modal-footer">
                <button type="button" className="scb-btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="scb-btn-send" disabled={loading || !msgText.trim()}>
                  {loading ? (
                    <><span className="scb-spinner" /> Sending…</>
                  ) : (
                    <>Send Message ➤</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StartChatButton;
