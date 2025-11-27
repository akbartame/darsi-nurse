export async function requestBluetoothDevice() {
  try {
    console.log("🔵 Requesting Bluetooth device...");

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [0x180D] }], // Heart Rate Service
      optionalServices: [0x180D]
    });

    console.log("📱 Selected device:", device.name);
    return device;
  } catch (error) {
    console.error("❌ Bluetooth request failed:", error);
    return null;
  }
}
