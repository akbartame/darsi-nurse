import React from "react";
import MQTTManager from "../utils/mqtt"; // your MQTT class

const MqttClient = ({ onLog, bleData }) => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [brokerUrl, setBrokerUrl] = React.useState('ws://broker.hivemq.com:8000/mqtt');
  const [topic, setTopic] = React.useState('ble-gateway/data');
  const [autoPublish, setAutoPublish] = React.useState(false);

  React.useEffect(() => {
    if (autoPublish && bleData && isConnected) {
      handlePublish(bleData);
    }
  }, [bleData, autoPublish, isConnected]);

  const handleConnect = async () => {
    onLog(`Connecting to MQTT: ${brokerUrl}`, 'info');
    
    const result = await MQTTManager.connect(brokerUrl);
    
    if (result.success) {
      setIsConnected(true);
      onLog('Connected to MQTT broker', 'success');
    } else {
      onLog(`MQTT connection failed: ${result.error}`, 'error');
    }
  };

  const handleDisconnect = () => {
    MQTTManager.disconnect();
    setIsConnected(false);
    onLog('Disconnected from MQTT broker', 'warning');
  };

  const handlePublish = async (message) => {
    const result = await MQTTManager.publish(topic, message);
    
    if (result.success) {
      onLog(`Published to ${topic}: ${message}`, 'success');
    } else {
      onLog(`Publish failed: ${result.error}`, 'error');
    }
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #ddd'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#333' }}>
        🌐 MQTT Client
      </h3>

      <div style={{
        padding: '1rem',
        background: isConnected ? '#d4edda' : '#fff',
        border: `2px solid ${isConnected ? '#28a745' : '#ddd'}`,
        borderRadius: '8px',
        marginBottom: '1rem'
      }}>
        <div style={{ fontWeight: 'bold' }}>
          Status: {isConnected ? '✅ Connected' : '⭕ Disconnected'}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
          Broker URL
        </label>
        <input
          type="text"
          value={brokerUrl}
          onChange={(e) => setBrokerUrl(e.target.value)}
          disabled={isConnected}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.875rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
          Topic
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '0.875rem',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={autoPublish}
            onChange={(e) => setAutoPublish(e.target.checked)}
            disabled={!isConnected}
            style={{ marginRight: '0.5rem' }}
          />
          <span style={{ fontSize: '0.875rem' }}>Auto-publish BLE data</span>
        </label>
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
    </div>
  );
};
export default MqttClient;