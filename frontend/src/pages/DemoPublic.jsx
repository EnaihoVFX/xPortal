import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import './DemoPublic.css'

function DemoPublic() {
  // Static URL that anyone can scan - each scan creates a unique account
  const publicDemoUrl = `${window.location.origin}/demo/join/public`

  return (
    <div className="demo-public-page">
      <div className="demo-public-content">
        <h1>Public Demo</h1>
        <p>Multiple people can scan this QR code</p>
        
        <div className="qr-container-large">
          <QRCodeSVG 
            value={publicDemoUrl}
            size={400}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="demo-instructions">
          <h3>How it works:</h3>
          <ol>
            <li>Scan the QR code with your phone</li>
            <li>Your account is created automatically</li>
            <li>You're logged in and ready to use</li>
          </ol>
        </div>

        <div className="demo-url-display">
          <p>Or visit:</p>
          <code>{publicDemoUrl}</code>
        </div>
      </div>
    </div>
  )
}

export default DemoPublic

