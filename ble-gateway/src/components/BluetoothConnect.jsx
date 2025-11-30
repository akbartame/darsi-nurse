import React from "react";
import BLEManager from "../utils/ble"; // your BLE class

const BluetoothConnect = ({ onConnectionChange, onLog, onDataReceived }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [deviceName, setDeviceName] = React.useState('');
  const [services, setServices] = React.useState([]);
  const [selectedChar, setSelectedChar] = React.useState(null);

  const handleConnect = async () => {
    onLog('Requesting Bluetooth device...', 'info');
    
    const result = await BLEManager.connect();
    
    if (result.success) {
      onLog(`Connected to: ${result.name}`, 'success');
      setIsConnected(true);
      setDeviceName(result.name);
      onConnectionChange(true, result.name);
      
      // Discover services
      discoverServices();
    } else {
      onLog(`Connection failed: ${result.error}`, 'error');
    }
  };

  const discoverServices = async () => {
    onLog('Discovering services...', 'info');
    
    try {
      const servicesInfo = await BLEManager.discoverServices();
      setServices(servicesInfo);
      
      onLog(`Found ${servicesInfo.length} services`, 'success');
      
      servicesInfo.forEach(service => {
        onLog(`Service: ${service.uuid}`, 'info');
        service.characteristics.forEach(char => {
          const props = Object.keys(char.properties)
            .filter(key => char.properties[key])
            .join(', ');
          onLog(`  Characteristic: ${char.uuid} [${props}]`, 'info');
          
          // Enable notifications on first notify-capable characteristic
          if (char.properties.notify && !selectedChar) {
            enableNotifications(char);
          }
        });
      });
    } catch (error) {
      onLog(`Service discovery failed: ${error.message}`, 'error');
    }
  };

  function decodeBleData(uuid, value) {
    const data = new Uint8Array(value.buffer);

    // HEART RATE (0x2A37)
    if (uuid.startsWith("00002a37")) {
      const flags = data[0];
      const hr16 = flags & 0x01;

      let heartRate;
      if (hr16) {
        heartRate = data[1] | (data[2] << 8);
      } else {
        heartRate = data[1];
      }

      return { type: "heartRate", heartRate };
    }

    // TEMPERATURE (0x2A1C)
    if (uuid.startsWith("00002a1c")) {
      // data[0] = flags
      const rawMantissa = (data[1] | (data[2] << 8) | (data[3] << 16));

      // Sign-extend 24-bit to 32-bit
      const mantissa = (rawMantissa & 0x800000) ? (rawMantissa | 0xFF000000) : rawMantissa;

      // exponent is signed 8-bit
      const exponent = (data[4] << 24) >> 24;

      const temperature = mantissa * Math.pow(10, exponent);

      return { type: "temperature", temperature };
    }


    // BATTERY (0x2A19)
    if (uuid.startsWith("00002a19")) {
      return { type: "battery", battery: data[0] };
    }

    return { type: "unknown", raw: data };
  }

  const enableNotifications = async (char) => {
    const result = await BLEManager.startNotifications(
      char.instance,
      handleNotification
    );
    
    if (result.success) {
      setSelectedChar(char);
      onLog(`Notifications enabled on ${char.uuid}`, 'success');
    }
  };

  function handleNotification(event) {
    const value = event.target.value;
    const uuid = event.target.uuid;
    const decoded = decodeBleData(uuid, value);

    console.log("Decoded Data:", decoded);
    

    // Kirim ke UI React (jika kamu pakai state)
    if (decoded.type === "heartRate") 
      onDataReceived({
        type: "heartRate",
        value: decoded.heartRate
      });
    if (decoded.type === "temperature") onDataReceived({
        type: "temperature",
        value: decoded.temperature
      });
    if (decoded.type === "battery") onDataReceived({
        type: "battery",
        value: decoded.battery
      });
  }


  const handleDisconnect = () => {
    BLEManager.disconnect();
    setIsConnected(false);
    setDeviceName('');
    setServices([]);
    setSelectedChar(null);
    onConnectionChange(false, '');
    onLog('Disconnected', 'warning');
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #ddd'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
        📡 Bluetooth Connection
      </h3>
      
      <div style={{
        padding: '1rem',
        background: isConnected ? '#d4edda' : '#fff',
        border: `2px solid ${isConnected ? '#28a745' : '#ddd'}`,
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
          Status: {isConnected ? '✅ Connected' : '⭕ Disconnected'}
        </div>
        {deviceName && (
          <div style={{ fontSize: '0.875rem', color: '#666' }}>
            Device: {deviceName}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={handleConnect}
          disabled={isConnected}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: isConnected ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isConnected ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          Connect
        </button>
        
        <button
          onClick={handleDisconnect}
          disabled={!isConnected}
          style={{
            flex: 1,
            padding: '0.75rem',
            background: !isConnected ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isConnected ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          Disconnect
        </button>
      </div>

      {services.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#667eea' }}>
              Services ({services.length})
            </summary>
            <div style={{ 
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '0.5rem',
              background: '#fff',
              borderRadius: '4px'
            }}>
              {services.map((service, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ color: '#667eea' }}>📦 {service.uuid}</div>
                  {service.characteristics.map((char, cidx) => (
                    <div key={cidx} style={{ marginLeft: '1rem', color: '#666' }}>
                      └─ {char.uuid}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
};
export default BluetoothConnect;