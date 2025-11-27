import mqtt from "mqtt";

export function createMqttClient() {
  const url = import.meta.env.VITE_MQTT_URL;

  const client = mqtt.connect(url, {
    username: import.meta.env.VITE_MQTT_USERNAME,
    password: import.meta.env.VITE_MQTT_PASSWORD,
  });

  client.on("connect", () => {
    console.log("MQTT Connected");
  });

  client.on("error", (err) => {
    console.error("MQTT Error:", err);
  });

  return client;
}
