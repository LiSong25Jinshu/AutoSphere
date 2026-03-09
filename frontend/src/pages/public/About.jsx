import './About.css';

const About = () => {
  const values = [
    {
      icon: '🚗',
      title: 'Quality First',
      description: 'We ensure every vehicle and service meets the highest standards.'
    },
    {
      icon: '🔒',
      title: 'Trust & Safety',
      description: 'Your security and privacy are our top priorities.'
    },
    {
      icon: '⚡',
      title: 'Innovation',
      description: 'We leverage cutting-edge technology to enhance your experience.'
    },
    {
      icon: '⭐',
      title: 'Excellence',
      description: 'We strive for excellence in everything we do.'
    }
  ];

  const team = [
    {
      name: 'Mr. Afoa Kwah Isaac',
      role: 'CEO & Founder',
      description: '15+ years in automotive industry',
      initials: 'AI'
    },
    {
      name: 'Mr. Nana A.B Agyapong',
      role: 'CTO',
      description: 'Expert in AI and machine learning',
      initials: 'NA'
    },
    {
      name: 'Miss. Welbeck E.A Maxiline',
      role: 'Head of Operations',
      description: 'Specialist in service optimization',
      initials: 'WM'
    }
  ];

  return (
    <div className="about-page">
      <div className="about-container">
        {/* Hero Section */}
        <div className="about-hero">
          <h1>About AutoSphere</h1>
          <p>
            We're revolutionizing the automotive industry by connecting car buyers, sellers, 
            and service providers through innovative technology and AI-powered solutions.
          </p>
        </div>

        <div className="about-content">
          {/* Mission & Vision */}
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To make automotive services accessible, transparent, and efficient for everyone 
                through the power of technology and human expertise.
              </p>
            </div>
            <div className="vision-card">
              <div className="icon">🔮</div>
              <h3>Our Vision</h3>
              <p>
                To become the world's leading platform for automotive services, 
                connecting millions of users with trusted providers globally.
              </p>
            </div>
          </div>

          {/* Story Section */}
          <div className="content-section">
            <h2>Our Story</h2>
            <p>
              AutoSphere was founded with a simple belief: the automotive industry needed a platform 
              that truly serves everyone - buyers, sellers, and service providers alike. We saw 
              fragmented services, lack of transparency, and missed opportunities for connection.
            </p>
            <p>
              Today, we're proud to offer a comprehensive platform that brings together vehicle 
              marketplace, service booking, real-time messaging, and AI-powered recommendations. 
              Our technology doesn't just connect people; it creates meaningful relationships 
              that drive the automotive industry forward.
            </p>
          </div>

          {/* Values Section */}
          <div className="content-section">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do:</p>
            <div className="features-grid">
              {values.map((value, index) => (
                <div key={index} className="feature-item">
                  <h4>{value.icon} {value.title}</h4>
                  <p>{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team Section */}
          <div className="content-section">
            <h2>Meet Our Team</h2>
            <p>The experts behind AutoSphere who are passionate about transforming the automotive experience:</p>
            <div className="team-grid">
              {team.map((member, index) => (
                <div key={index} className="team-member">
                  <div className="team-avatar">
                    {member.initials}
                  </div>
                  <h4>{member.name}</h4>
                  <div className="role">{member.role}</div>
                  <div className="description">{member.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <h2>AutoSphere by the Numbers</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Vehicles Listed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">5K+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Service Providers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Cities Covered</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="about-cta">
          <h2>Ready to Join AutoSphere?</h2>
          <p>
            Whether you're looking to buy a car, sell a vehicle, or provide automotive services, 
            we're here to help you succeed.
          </p>
          <a href="/register" className="cta-button">
            Get Started Today
          </a>
        </div>
      </div>
    </div>
  );
};

export default About;