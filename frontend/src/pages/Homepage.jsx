import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Homepage.css'

function Homepage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const fullText = 'Trade on the future. Predict with confidence.'

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, currentIndex === 0 ? 500 : currentIndex === 19 ? 200 : 100)
      
      return () => clearTimeout(timeout)
    }
  }, [currentIndex, fullText])

  return (
    <div className="homepage">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div 
            className="cursor-glow"
            style={{
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`
            }}
          ></div>
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
          <div className="grid-pattern"></div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="typewriter-text">
              {displayedText}
              {currentIndex < fullText.length && <span className="cursor-blink">|</span>}
            </span>
            {currentIndex >= fullText.length && (
              <>
                <br />
                <span className="gradient-text subtitle-line">
                  Predict the future. <span className="gradient-text-2">Trade with confidence.</span>
                </span>
              </>
            )}
          </h1>
          <p className="hero-description">
            A permissionless prediction market platform where you can bet on any event, 
            from politics to sports to technology. Powered by blockchain.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={() => navigate('/markets')}
                  className="btn-primary"
                >
                  <span>Browse Markets</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary"
                >
                  Dashboard
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/signup')}
                  className="btn-primary"
                >
                  <span>Get Started</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button 
                  onClick={() => navigate('/demo')}
                  className="btn-secondary"
                >
                  Try Demo
                </button>
              </>
            )}
          </div>
          
          {/* Stats */}
          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">25+</div>
              <div className="stat-label">Active Markets</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">$2.5M+</div>
              <div className="stat-label">Volume Traded</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">1,200+</div>
              <div className="stat-label">Active Traders</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="section-header">
            <h2 className="section-title">Why choose us</h2>
            <p className="section-subtitle">Built for the future of prediction markets</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🔮</div>
                <div className="feature-glow"></div>
              </div>
              <h3>Any Event</h3>
              <p>Bet on politics, sports, crypto, technology, and more. Create markets for any future event.</p>
              <div className="feature-link">Learn more →</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">⚡</div>
                <div className="feature-glow"></div>
              </div>
              <h3>Fast & Secure</h3>
              <p>Built on blockchain technology for instant settlements and transparent, immutable records.</p>
              <div className="feature-link">Learn more →</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">🤖</div>
                <div className="feature-glow"></div>
              </div>
              <h3>AI-Powered</h3>
              <p>Agentic trading system with multi-agent analysis to help you make informed decisions.</p>
              <div className="feature-link">Learn more →</div>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <div className="feature-icon">💰</div>
                <div className="feature-glow"></div>
              </div>
              <h3>Low Fees</h3>
              <p>Minimal transaction costs with efficient market mechanisms and liquidity pools.</p>
              <div className="feature-link">Learn more →</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to start trading?</h2>
          <p>Join thousands of traders making predictions on the future</p>
          {!isAuthenticated && (
            <div className="cta-actions">
              <button 
                onClick={() => navigate('/signup')}
                className="btn-primary-large"
              >
                Create Account
              </button>
              <button 
                onClick={() => navigate('/demo')}
                className="btn-link-large"
              >
                Try Demo First
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Homepage
