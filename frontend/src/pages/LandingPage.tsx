import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'
import './LandingPage.css'

export function LandingPage() {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const handleGetStarted = () => {
    navigate('/login')
  }


  return (
    <div style={{ backgroundColor: '#0a0a0f', overflowY: 'hidden', width: '100%', height: '100%', position: 'relative' }} className="landing-page">
      <header className="landing-header">
        <div className="landing-header-inner ">
          <Link to="/" className="landing-brand">
            <span className="brand-icon"><img style={{ position: 'relative', top: '10px', width: '40px', height: '40px' }} src="/images/logo.png" alt="Logo" className="logo-image" /></span>
            Ahoum
                  </Link>
                  <div className="landing-header-right">
                      <Link to="/signup" className="landing-signup-link">Sign up</Link>
                      <Link to="/login" className="landing-login-btn">Log in</Link>
                  </div>
              </div>
          </header>

          <section ref={heroRef} className={`hero-section ${isVisible ? 'visible' : ''}`}>
              {/* Decorative background elements */}
              <img src="/images/g108.png" alt="" className="decorative-cloud" />
              <img src="/images/g110.png" alt="" className="decorative-cloud1" />
              <img src="/images/path114.png" alt="" className="decorative-circle" />

              <div className="hero-content" >

                  <h1 className="hero-title">
                      Transform Your Journey with
                      <span className="gradient-text"> Expert Guidance</span>
                  </h1>
                  <p className="hero-description">
                      Discover and book spiritual and coaching sessions on Ahoum.
                  </p>
                  <div className="hero-cta">
                      <button className="cta-primary" onClick={handleGetStarted}>
                          Get Started
                          <span className="cta-arrow"><FaArrowRight /></span>
                      </button>
                  </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }} className="hero-image-container">
                  <img src="/images/LandingPage.png" alt="Hero Image"  />
              </div>
          </section>


{/* 

      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Begin Your Journey?</h2>
          <p className="cta-text">
            Join thousands of seekers and creators on Ahoum today
          </p>
          <div className="cta-buttons">
            <button className="cta-primary large" onClick={handleGetStarted}>
              Get Started Free
              <span className="cta-arrow"><FaArrowRight /></span>
            </button>
            <Link to="/sessions" className="cta-secondary large">
              Browse Sessions
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="brand-icon"><FaLeaf /></span>
            Ahoum
          </div>
          <div className="footer-links">
            <Link to="/sessions">Sessions</Link>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Ahoum. All rights reserved.</p>
        </div>
      </footer> */}
    </div>
  )
}
