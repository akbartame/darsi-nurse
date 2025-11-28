import { useState, useEffect } from 'react';
import Dashboard from "./pages/dashboard";
// import Home from "./pages/Home"; // Optional
import BLEManager from "./utils/ble"; // your BLE class

function App() {
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availabilityDetails, setAvailabilityDetails] = useState(null);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    // Get platform info
    const platformInfo = BLEManager.getPlatformInfo();
    console.log('Platform Info:', platformInfo);

    // Check basic availability
    const isAvailable = BLEManager.isAvailable();
    
    if (!isAvailable) {
      // Get detailed availability
      const details = await BLEManager.getAvailabilityDetails();
      console.log('Availability Details:', details);
      setAvailabilityDetails(details);

      // Set appropriate error or warning
      if (!details.supported) {
        setError(details.message);
      } else if (!details.secureContext) {
        if (platformInfo.isAndroid) {
          setError('Android requires HTTPS. Please access this app via HTTPS or use Chrome flags for testing.');
        } else {
          setError(details.message);
        }
      } else if (details.available === false) {
        setWarning(details.message + '. Bluetooth may need to be enabled in device settings.');
      }
    } else {
      // Check detailed availability even when basic check passes
      const details = await BLEManager.getAvailabilityDetails();
      console.log('Availability Details:', details);
      setAvailabilityDetails(details);
      
      if (platformInfo.isAndroid && !platformInfo.isSecureContext) {
        setWarning('For best results on Android, use HTTPS');
      }
    }

    setIsLoading(false);
  };

  const enableTestMode = () => {
    // Instructions for testing without HTTPS on Android
    alert(
      'To test without HTTPS on Android Chrome:\n\n' +
      '1. Open Chrome and go to: chrome://flags\n' +
      '2. Search for "Insecure origins treated as secure"\n' +
      '3. Add your local IP address (e.g., http://192.168.1.100:5173)\n' +
      '4. Restart Chrome\n' +
      '5. Make sure Bluetooth is enabled on your device\n\n' +
      'Note: For production, always use HTTPS!'
    );
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          padding: '2rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ 
            fontSize: '3rem', 
            marginBottom: '1rem'
          }}>
            🔍
          </div>
          <p style={{ color: '#666', margin: 0 }}>Checking Bluetooth availability...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const platformInfo = BLEManager.getPlatformInfo();
    
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '2rem'
      }}>
        <div style={{
          maxWidth: '600px',
          padding: '2rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {platformInfo.isAndroid ? '📱' : '⚠️'}
          </div>
          <h2 style={{ 
            color: '#dc3545', 
            marginBottom: '1rem',
            marginTop: 0 
          }}>
            {platformInfo.isAndroid ? 'Android Setup Required' : 'Browser Not Supported'}
          </h2>
          <p style={{ 
            color: '#666',
            lineHeight: '1.6',
            marginBottom: '1.5rem'
          }}>
            {error}
          </p>

          {platformInfo.isAndroid && !platformInfo.isSecureContext && (
            <div style={{
              padding: '1rem',
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '8px',
              marginBottom: '1rem',
              textAlign: 'left'
            }}>
              <strong style={{ color: '#856404' }}>For Android Chrome:</strong>
              <ol style={{ 
                marginBottom: 0, 
                paddingLeft: '1.5rem',
                marginTop: '0.5rem',
                color: '#856404',
                fontSize: '0.875rem'
              }}>
                <li>Make sure Bluetooth is enabled on your device</li>
                <li>Use HTTPS for production</li>
                <li>For testing, use Chrome flags (see button below)</li>
              </ol>
            </div>
          )}
          
          <div style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'left',
            marginBottom: '1rem'
          }}>
            <strong style={{ color: '#333' }}>Supported Browsers:</strong>
            <ul style={{ 
              marginBottom: 0, 
              paddingLeft: '1.5rem',
              marginTop: '0.5rem',
              color: '#666'
            }}>
              <li>Chrome (Desktop & Android) ✅</li>
              <li>Microsoft Edge (Desktop) ✅</li>
              <li>Opera (Desktop) ✅</li>
              <li>Firefox - Not supported ❌</li>
              <li>Safari - Not supported ❌</li>
            </ul>
          </div>

          {availabilityDetails && (
            <div style={{
              padding: '1rem',
              background: '#e7f3ff',
              border: '1px solid #b3d9ff',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              textAlign: 'left'
            }}>
              <strong>🔍 Diagnostic Info:</strong>
              <ul style={{ 
                marginBottom: 0, 
                paddingLeft: '1.5rem',
                marginTop: '0.5rem',
                color: '#004085'
              }}>
                <li>API Supported: {availabilityDetails.supported ? '✅' : '❌'}</li>
                <li>Secure Context: {availabilityDetails.secureContext ? '✅' : '❌'}</li>
                <li>Protocol: {availabilityDetails.protocol}</li>
                <li>Platform: {platformInfo.isAndroid ? 'Android' : platformInfo.isIOS ? 'iOS' : 'Desktop'}</li>
              </ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            {platformInfo.isAndroid && !platformInfo.isSecureContext && (
              <button
                onClick={enableTestMode}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#ffc107',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                📋 Testing Instructions
              </button>
            )}
            
            <a 
              href="https://caniuse.com/web-bluetooth" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            >
              Browser Compatibility
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {warning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          padding: '1rem',
          background: '#fff3cd',
          borderBottom: '2px solid #ffc107',
          textAlign: 'center',
          zIndex: 1000,
          color: '#856404'
        }}>
          ⚠️ {warning}
          <button
            onClick={() => setWarning(null)}
            style={{
              marginLeft: '1rem',
              padding: '0.25rem 0.75rem',
              background: 'transparent',
              border: '1px solid #856404',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#856404'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <Dashboard />
    </>
  );
}

export default App;
