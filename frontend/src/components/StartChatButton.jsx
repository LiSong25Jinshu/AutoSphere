/**
 * StartChatButton — drop this anywhere to let the current user
 * open a conversation with another user (dealer, service provider, etc.)
 *
 * Usage:
 *   <StartChatButton userId={dealer.id} userName="John Smith" />
 *   <StartChatButton userId={provider.id} userName="AutoFix Ltd" label="Message Provider" />
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { messageAPI } from '../services/api';
import './StartChatButton.css';

const StartChatButton = ({
  userId,
  userName = 'this person',
  label = 'Message',
  icon = '💬',
  variant = 'primary',   // 'primary' | 'outline' | 'ghost'
  size = 'md',           // 'sm' | 'md' | 'lg'
  className = '',
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [error, setError] = useState('');

  const handleClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: window.location.pathname } } });
      return;
    }
    setShowModal(true);
    setMsgText('');
    setError('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await messageAPI.startConversation(userId, msgText.trim());
      if (res.data.success) {
        setShowModal(false);
        // Navigate to messages with the new conversation
        navigate('/user-messages');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="scb-modal-header">
              <div className="scb-modal-title">
                <span className="scb-modal-icon">💬</span>
                <div>
                  <h3>Message {userName}</h3>
                  <p>Start a conversation</p>
                </div>
              </div>
              <button
                className="scb-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSend}>
              <div className="scb-modal-body">
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
                <button
                  type="button"
                  className="scb-btn-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="scb-btn-send"
                  disabled={loading || !msgText.trim()}
                >
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
