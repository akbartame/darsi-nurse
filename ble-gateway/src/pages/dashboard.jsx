import BluetoothConnect from "../components/BluetoothConnect";
import MqttClient from "../components/MqttClient";

export default function Dashboard() {
  return (
    <div style={{ padding: 20 }}>
      <h1>BLE Gateway Dashboard</h1>
      <BluetoothConnect />
      <MqttClient />
    </div>
  );
}
