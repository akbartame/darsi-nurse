import React from "react";
import BluetoothConnect from "../components/BluetoothConnect";
import MqttClient from "../components/MqttClient";

const Dashboard = () => {
  const [logs, setLogs] = React.useState([]);
  const [bleConnected, setBleConnected] = React.useState(false);
  const [bleDeviceName, setBleDeviceName] = React.useState('');
  const [receivedData, setReceivedData] = React.useState([]);
  const [latestBleData, setLatestBleData] = React.useState(null);

  const addLog = React.useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }, []);

  const handleBleConnectionChange = (connected, deviceName) => {
    setBleConnected(connected);
    setBleDeviceName(deviceName);
  };

  const handleDataReceived = (data) => {
    const timestamp = new Date().toLocaleTimeString();
    setReceivedData(prev => [...prev, { timestamp, data }]);
    setLatestBleData(data);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            BLE Gateway Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '1rem' }}>
            Bluetooth Low Energy to MQTT Bridge
          </p>
        </div>

        {/* Connection Components */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <BluetoothConnect 
            onConnectionChange={handleBleConnectionChange}
            onLog={addLog}
            onDataReceived={handleDataReceived}
          />
          
          <MqttClient 
            onLog={addLog}
            bleData={latestBleData}
          />
        </div>

        {/* Received Data */}
        <div style={{
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #ddd',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#333' }}>📥 Received Data</h3>
            <button
              onClick={() => setReceivedData([])}
              style={{
                padding: '0.5rem 1rem',
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear
            </button>
          </div>
          <div style={{
            maxHeight: '200px',
            overflowY: 'auto',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '0.75rem',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {receivedData.length === 0 ? (
              <div style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                No data received yet
              </div>
            ) : (
              receivedData.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#999' }}>[{item.timestamp}]</span>{' '}
                  <span style={{ color: '#28a745' }}>
                    {item.data.type}: {item.data.value}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Debug Logs */}
        <div style={{
          padding: '1.5rem',
          background: '#1e1e1e',
          borderRadius: '8px',
          color: '#ddd'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>🐛 Debug Logs</h3>
            <button
              onClick={() => setLogs([])}
              style={{
                padding: '0.5rem 1rem',
                background: '#495057',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Clear Logs
            </button>
          </div>
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            background: '#000',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '1rem',
            fontSize: '0.875rem',
            fontFamily: 'monospace'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>
                No logs yet. Connect to start debugging.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    marginBottom: '0.5rem',
                    color: log.type === 'error' ? '#ff6b6b' : 
                           log.type === 'warning' ? '#ffd93d' :
                           log.type === 'success' ? '#6bcf7f' : '#ddd'
                  }}
                >
                  <span style={{ color: '#888' }}>[{log.timestamp}]</span>{' '}
                  <span style={{ 
                    color: log.type === 'error' ? '#ff6b6b' : 
                           log.type === 'warning' ? '#ffd93d' :
                           log.type === 'success' ? '#6bcf7f' : '#51cf66',
                    fontWeight: 'bold'
                  }}>
                    {log.type.toUpperCase()}
                  </span>: {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;