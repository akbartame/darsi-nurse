import { useState } from "react";
import { requestBluetoothDevice } from "../utils/ble";

export default function BluetoothConnect() {
  const [deviceInfo, setDeviceInfo] = useState(null);

  async function handleConnect() {
    console.log("🔌 handleConnect called");

    const device = await requestBluetoothDevice();

    if (device) {
        console.log("✅ Device connected:", device.name);
        setDeviceInfo(device.name || "Unknown Device");
    } else {
        console.log("⚠ No device selected");
    }
    }

  return (
    <div style={{ padding: 20, border: "1px solid #444", borderRadius: 8 }}>
      <h2>Bluetooth Connection</h2>

      <button onClick={handleConnect}
      className="bg-blue-600 text-white px-4 py-3 rounded-xl w-full"
      >
        Enable Bluetooth & Connect
      </button>

      {deviceInfo && (
        <p>Connected to: <strong>{deviceInfo}</strong></p>
      )}
    </div>
  );
}
