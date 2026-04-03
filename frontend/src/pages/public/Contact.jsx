import { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock form submission
    setTimeout(() => {
      console.log('Contact form submitted:', formData);
      setSubmitted(true);
      setLoading(false);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }, 3000);
    }, 1000);
  };

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email Us',
      details: 'support@autosphere.com',
      description: 'Send us an email anytime'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: '+233 55 008 6700',
      description: 'Mon-Fri 9AM-6PM EST'
    },
    {
      icon: '🕒',
      title: 'Business Hours',
      details: 'Mon-Fri: 9AM-6PM',
      description: 'Weekend support available'
    }
  ];

  const faqs = [
    {
      question: 'How do I book a service?',
      answer: 'Simply create an account, browse our service providers, and book an appointment that fits your schedule.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your personal information.'
    },
    {
      question: 'Can I cancel my appointment?',
      answer: 'Yes, you can cancel or reschedule appointments up to 24 hours before the scheduled time.'
    },
    {
      question: 'How does the AI recommendation work?',
      answer: 'Our AI analyzes your preferences, budget, and usage patterns to suggest vehicles that best match your needs.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards, PayPal, and bank transfers for your convenience.'
    },
    {
      question: 'Do you offer 24/7 support?',
      answer: 'We offer extended support hours and emergency assistance for urgent matters outside business hours.'
    }
  ];

  return (
    <div className="contact-page">
      <div className="contact-container">
        {/* Header */}
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Get in touch with our team.</p>
        </div>

        {/* Main Content */}
        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <h2>Send us a Message</h2>
            
            {submitted && (
              <div className="success-message">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Subject <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Message <span className="required">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="6"
                  placeholder="Tell us how we can help you..."
                  required
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading || submitted}
              >
                {loading ? 'Sending...' : submitted ? 'Message Sent!' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="contact-info-section">
            <h2>Get in Touch</h2>
            <p>Have questions? We're here to help.</p>

            <div className="contact-info-list">
              {contactInfo.map((info, index) => (
                <div key={index} className="contact-info-item">
                  <div className="contact-icon">
                    {info.icon}
                  </div>
                  <div className="contact-details">
                    <h3>{info.title}</h3>
                    <p>
                      {info.title === 'Email Us' ? (
                        <a href={`mailto:${info.details}`}>{info.details}</a>
                      ) : info.title === 'Call Us' ? (
                        <a href={`tel:${info.details}`}>{info.details}</a>
                      ) : (
                        info.details
                      )}
                    </p>
                    <p>{info.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Office Hours */}
            <div className="office-hours">
              <h3>Office Hours</h3>
              <div className="hours-list">
                <div className="hours-item">
                  <span className="day">Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="hours-item">
                  <span className="day">Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="hours-item">
                  <span className="day">Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeFaq === index ? 'active' : ''}`}
              >
                <div 
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.question}</span>
                  <span className="icon">▼</span>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="map-section">
          <h2>Find Us</h2>
          <div className="map-placeholder">
            🗺️ Interactive Map Coming Soon
            <br />
            <small>123 Auto Street, Car City, CC 12345</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;