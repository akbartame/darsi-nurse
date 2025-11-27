import { useEffect, useState } from "react";
import { createMqttClient } from "../utils/mqtt";

export default function MqttClient() {
  const [status, setStatus] = useState("Connecting...");
  
  useEffect(() => {
    const client = createMqttClient();

    client.on("connect", () => setStatus("Connected"));
    client.on("disconnect", () => setStatus("Disconnected"));

    return () => client.end();
  }, []);

  return (
    <div style={{ padding: 20, border: "1px solid #444", borderRadius: 8 }}>
      <h2>MQTT Status</h2>
      <p>{status}</p>
    </div>
  );
}
