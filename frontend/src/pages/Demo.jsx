import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../hooks/useAuth'
import './Demo.css'

function Demo() {
  const [demoUrl, setDemoUrl] = useState('')
  const navigate = useNavigate()
  const { register } = useAuth()

  React.useEffect(() => {
    const token = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const url = `${window.location.origin}/demo/join?token=${token}`
    setDemoUrl(url)
  }, [])

  const handleTryDemo = async () => {
    const testEmail = `demo_${Date.now()}@test.com`
    const testPassword = 'demo123'
    
    const result = await register(testEmail, testPassword)
    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="demo-page">
      <div className="demo-content">
        <h1>Try the Demo</h1>
        
        <div className="demo-main">
          <div className="qr-section">
            <QRCodeSVG 
              value={demoUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
            <p>Scan with your phone</p>
          </div>

          <div className="divider">or</div>

          <button onClick={handleTryDemo} className="demo-button">
            Try Now
          </button>
        </div>

        <div className="demo-benefits">
          <p>✓ Instant account</p>
          <p>✓ Test wallet included</p>
          <p>✓ Ready to use</p>
        </div>

        <div className="demo-link">
          <Link to="/demo/public">Need a shared QR code for multiple people? →</Link>
        </div>
      </div>
    </div>
  )
}

export default Demo
