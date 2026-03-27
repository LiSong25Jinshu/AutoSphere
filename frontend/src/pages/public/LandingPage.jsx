import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import "./LandingPage.css";
import {
  CarIcon,
  ServiceIcon,
  MessageIcon,
  ArrowRightIcon,
  SpeedometerIcon,
} from "../../components/icons/AutoSphereIcons";

const LandingPage = () => {
  // Slideshow data with 5 images using public folder paths
  const slides = [
    {
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Premium Vehicle Marketplace",
      subtitle: "Discover Your Perfect Vehicle",
      description:
        "Browse thousands of premium vehicles with AI-powered recommendations tailored to your needs and budget.",
    },
    {
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Expert Service Network",
      subtitle: "Professional Automotive Care",
      description:
        "Connect with certified mechanics and service providers for all your maintenance and repair needs.",
    },
    {
      image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2083&q=80",
      title: "Smart Technology Platform",
      subtitle: "Innovation Meets Automotive",
      description:
        "Experience the future of automotive services with our intelligent platform and real-time communication.",
    },
    {
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Complete Automotive Solutions",
      subtitle: "Everything Under One Roof",
      description:
        "From buying and selling to maintenance and repairs, manage all your automotive needs in one place.",
    },
    {
      image: "https://images.unsplash.com/photo-1486496572940-2bb2341fdbdf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      title: "Advanced Analytics Dashboard",
      subtitle: "Data-Driven Decisions",
      description:
        "Get insights into market trends, vehicle performance, and personalized recommendations with our analytics.",
    },
  ];

  // Only 3 features as requested
  const features = [
    {
      icon: <CarIcon size={48} />,
      title: "Vehicle Marketplace",
      description:
        "Browse and search through our extensive collection of vehicles with smart recommendations.",
      color: "var(--autosphere-dark-grey)",
    },
    {
      icon: <ServiceIcon size={48} />,
      title: "Service Booking",
      description: "Book trusted service providers for maintenance and car care.",
      color: "var(--autosphere-medium-grey)",
    },
    {
      icon: <MessageIcon size={48} />,
      title: "Real-time Messaging",
      description:
        "Chat securely with dealers and service providers in real time.",
      color: "var(--autosphere-dark-grey)",
    },
  ];

  const stats = [
    { number: "15,000+", label: "Vehicles Listed" },
    { number: "8,000+", label: "Happy Customers" },
    { number: "750+", label: "Service Providers" },
    { number: "65+", label: "Cities Covered" },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  // Automatic slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Manual slide navigation
  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="autosphere-landing-page">
      {/* HERO SECTION WITH SLIDESHOW */}
      <section className="autosphere-hero autosphere-hero-slideshow">
        <div className="autosphere-slideshow-container">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`autosphere-slide ${
                index === currentSlide ? "active" : ""
              }`}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(44, 44, 44, 0.4) 0%, rgba(26, 26, 26, 0.6) 100%), url(${slide.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="autosphere-hero-content">
                <h1 className="autosphere-hero-title">{slide.title}</h1>
                <p className="autosphere-hero-subtitle">{slide.subtitle}</p>
                <p className="autosphere-hero-description">
                  {slide.description}
                </p>
                <div className="autosphere-hero-buttons">
                  <Link
                    to="/vehicles"
                    className="autosphere-btn autosphere-btn-white autosphere-btn-lg"
                  >
                    Browse Vehicles
                    <ArrowRightIcon size={20} className="autosphere-ml-2" />
                  </Link>
                  <Link
                    to="/register"
                    className="autosphere-btn autosphere-btn-secondary autosphere-btn-lg autosphere-hero-btn-secondary"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slideshow Controls */}
        <div className="autosphere-slideshow-controls">
          <button
            className="autosphere-slide-btn autosphere-slide-prev"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className="autosphere-slide-btn autosphere-slide-next"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ›
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="autosphere-slide-indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`autosphere-slide-indicator ${
                index === currentSlide ? "active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Welcome Badge */}
        <div className="autosphere-hero-badge">
          <SpeedometerIcon size={24} />
          <span>Welcome to AutoSphere</span>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="autosphere-stats-section">
        <div className="autosphere-container">
          <div className="autosphere-stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="autosphere-stat-item autosphere-fade-in"
              >
                <div className="autosphere-stat-number">{stat.number}</div>
                <div className="autosphere-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMPLIFIED FEATURES SECTION - Only 3 features */}
      <section className="autosphere-features-section">
        <div className="autosphere-container">
          <div className="autosphere-features-content">
            <h2 className="autosphere-features-title">Core Features</h2>
            <p className="autosphere-features-subtitle">
              Everything you need for your automotive journey
            </p>

            <div className="autosphere-features-grid">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="autosphere-feature-card autosphere-hover-lift"
                >
                  <div className="autosphere-feature-header">
                    <div
                      className="autosphere-feature-icon"
                      style={{ color: feature.color }}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="autosphere-feature-title">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="autosphere-feature-description">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section
        className="autosphere-cta-section"
        style={{
          background: `linear-gradient(135deg, rgba(44, 44, 44, 0.7) 0%, rgba(26, 26, 26, 0.8) 100%), url(https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2083&q=80)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="autosphere-cta-container">
          <h2 className="autosphere-cta-title">
            Ready to Experience Smart Car Management?
          </h2>
          <p className="autosphere-cta-description">
            Join thousands of satisfied customers and discover why AutoSphere
            is the future of automotive services
          </p>
          <div className="autosphere-cta-buttons">
            <Link
              to="/register"
              className="autosphere-btn autosphere-btn-white autosphere-btn-lg"
            >
              Create Your Account
            </Link>
            <Link
              to="/about"
              className="autosphere-btn autosphere-btn-secondary autosphere-btn-lg autosphere-cta-btn-secondary"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;