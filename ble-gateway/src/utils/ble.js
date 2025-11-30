const WANTED_SERVICES = [
  'battery_service',         // 0x180F
  'device_information',      // 0x180A
  'heart_rate',              // 0x180D
  'health_thermometer',      // 0x1809
  'generic_access',          // 0x1800
  'generic_attribute'        // 0x1801
];


export const BLEManager = {
  device: null,
  server: null,
  characteristic: null,
  notificationHandlers: new Map(),
  
  /**
   * Check if Web Bluetooth API is available
   * On Android, additional checks are needed
   */
  isAvailable() {
    // Check if bluetooth is in navigator
    if (!('bluetooth' in navigator)) {
      return false;
    }

    // Additional check for secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.warn('Web Bluetooth requires a secure context (HTTPS)');
      return false;
    }

    return true;
  },

  /**
   * Check detailed availability status
   * Returns object with more information about availability
   */
  async getAvailabilityDetails() {
    const details = {
      supported: 'bluetooth' in navigator,
      secureContext: window.isSecureContext,
      protocol: window.location.protocol,
      available: false,
      message: ''
    };

    if (!details.supported) {
      details.message = 'Web Bluetooth API is not supported in this browser';
      return details;
    }

    if (!details.secureContext) {
      details.message = 'Web Bluetooth requires HTTPS or localhost';
      return details;
    }

    // Try to check Bluetooth availability
    try {
      if (navigator.bluetooth.getAvailability) {
        details.available = await navigator.bluetooth.getAvailability();
        if (!details.available) {
          details.message = 'Bluetooth is not available on this device';
        } else {
          details.message = 'Bluetooth is available';
        }
      } else {
        // If getAvailability is not supported, assume available
        details.available = true;
        details.message = 'Bluetooth appears to be supported';
      }
    } catch (error) {
      details.message = `Error checking availability: ${error.message}`;
    }

    return details;
  },

  /**
   * Request Bluetooth permissions explicitly (helpful for Android)
   * This triggers the browser's permission dialog
   */
  async requestPermissions() {
    try {
      console.log('Requesting Bluetooth permissions...');
      
      // Trigger permission request by attempting to scan
      // This will show the device picker dialog which requests permissions
      await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: WANTED_SERVICES
      });
      
      return { success: true, message: 'Permissions granted' };
    } catch (error) {
      if (error.name === 'NotFoundError') {
        // User cancelled - this is actually OK for permission request
        return { success: true, message: 'Permission dialog shown' };
      }
      return { success: false, error: error.message };
    }
  },

  /**
   * Connect to a BLE device with Android-specific handling
   */
  async connect(options = {}) {
    try {
      const {
        filters = [
          { services: ['battery_service'] },
          { namePrefix: 'ESP' },
          { namePrefix: 'Arduino' },
          { namePrefix: 'Nordic' }
        ],
        optionalServices = WANTED_SERVICES,
        acceptAllDevices = false
      } = options;

      console.log('Requesting Bluetooth device...');
      console.log('Filters:', filters);

      // Request device with proper configuration
      // const requestOptions = acceptAllDevices 
      //   ? { acceptAllDevices: true, optionalServices }
      //   : { filters, optionalServices };
      const requestOptions = {
        acceptAllDevices: true,
        optionalServices: WANTED_SERVICES
      };
      this.device = await navigator.bluetooth.requestDevice(requestOptions);

      console.log('Device selected:', this.device.name || 'Unnamed');

      // Listen for disconnect
      this.device.addEventListener('gattserverdisconnected', this.onDisconnected.bind(this));

      // Connect to GATT server
      console.log('Connecting to GATT server...');
      this.server = await this.device.gatt.connect();
      console.log('Connected to GATT server');

      return {
        success: true,
        device: this.device,
        name: this.device.name || 'Unnamed Device',
        id: this.device.id
      };
    } catch (error) {
      console.error('Connection error:', error);
      
      // Provide more helpful error messages
      let errorMessage = error.message;
      
      if (error.name === 'NotFoundError') {
        errorMessage = 'No device selected. Please try again and select a device.';
      } else if (error.name === 'SecurityError') {
        errorMessage = 'Security error. Make sure you are using HTTPS or localhost.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Web Bluetooth is not supported on this device/browser.';
      }

      return {
        success: false,
        error: errorMessage,
        errorName: error.name
      };
    }
  },

  /**
   * Discover all services and characteristics
   */
  async discoverServices() {
    if (!this.server) {
      throw new Error('Not connected to GATT server');
    }

    console.log('Discovering services...');
    const servicesInfo = [];
    
    try {
      const services = await this.server.getPrimaryServices();
      console.log(`Found ${services.length} services`);

      for (const service of services) {
        const serviceInfo = {
          uuid: service.uuid,
          isPrimary: service.isPrimary,
          characteristics: []
        };

        try {
          const characteristics = await service.getCharacteristics();
          console.log(`Service ${service.uuid} has ${characteristics.length} characteristics`);
          
          for (const char of characteristics) {
            const properties = {
              read: char.properties.read,
              write: char.properties.write,
              writeWithoutResponse: char.properties.writeWithoutResponse,
              notify: char.properties.notify,
              indicate: char.properties.indicate,
              authenticatedSignedWrites: char.properties.authenticatedSignedWrites,
              reliableWrite: char.properties.reliableWrite,
              writableAuxiliaries: char.properties.writableAuxiliaries
            };

            serviceInfo.characteristics.push({
              uuid: char.uuid,
              properties,
              instance: char
            });

            // Auto-select first writable characteristic
            if (!this.characteristic && (char.properties.write || char.properties.writeWithoutResponse)) {
              this.characteristic = char;
              console.log('Auto-selected characteristic:', char.uuid);
            }
          }
        } catch (error) {
          console.error(`Error reading characteristics for service ${service.uuid}:`, error);
          serviceInfo.error = error.message;
        }

        servicesInfo.push(serviceInfo);
      }
    } catch (error) {
      console.error('Error discovering services:', error);
      throw error;
    }

    return servicesInfo;
  },

  /**
   * Start notifications on a characteristic
   */
  async startNotifications(characteristic, callback) {
    try {
      console.log('Starting notifications on:', characteristic.uuid);
      await characteristic.startNotifications();
      
      const handler = (event) => {
        callback(event);
      };
      
      characteristic.addEventListener('characteristicvaluechanged', handler);
      this.notificationHandlers.set(characteristic.uuid, handler);
      
      console.log('Notifications started successfully');
      return { success: true };
    } catch (error) {
      console.error('Error starting notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Stop notifications on a characteristic
   */
  async stopNotifications(characteristic) {
    try {
      await characteristic.stopNotifications();
      
      const handler = this.notificationHandlers.get(characteristic.uuid);
      if (handler) {
        characteristic.removeEventListener('characteristicvaluechanged', handler);
        this.notificationHandlers.delete(characteristic.uuid);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Write data to a characteristic
   */
  async writeData(data, useCharacteristic = null) {
    try {
      const char = useCharacteristic || this.characteristic;
      if (!char) {
        throw new Error('No characteristic available');
      }

      console.log('Writing data:', data);
      const encoder = new TextEncoder();
      const encodedData = encoder.encode(data);
      
      // Use writeWithoutResponse if available for better performance
      if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(encodedData);
        console.log('Data written (without response)');
      } else if (char.properties.write) {
        await char.writeValue(encodedData);
        console.log('Data written (with response)');
      } else {
        throw new Error('Characteristic does not support write operations');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Write error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Read data from a characteristic
   */
  async readData(characteristic) {
    try {
      console.log('Reading from characteristic:', characteristic.uuid);
      const value = await characteristic.readValue();
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(value);
      
      console.log('Read value:', text);
      return { success: true, data: text, rawValue: value };
    } catch (error) {
      console.error('Read error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Disconnect from the device
   */
  disconnect() {
    console.log('Disconnecting...');
    
    if (this.device && this.device.gatt.connected) {
      // Clear all notification handlers
      this.notificationHandlers.clear();
      this.device.gatt.disconnect();
      console.log('Disconnected');
    }
    
    this.device = null;
    this.server = null;
    this.characteristic = null;
  },

  /**
   * Handle disconnection event
   */
  onDisconnected(event) {
    console.log('Device disconnected:', event.target);
    this.server = null;
    this.characteristic = null;
    this.notificationHandlers.clear();
  },

  /**
   * Check if currently connected
   */
  isConnected() {
    return this.device && this.device.gatt.connected;
  },

  /**
   * Get device info
   */
  getDeviceInfo() {
    if (!this.device) {
      return null;
    }

    return {
      name: this.device.name || 'Unnamed Device',
      id: this.device.id,
      connected: this.device.gatt.connected
    };
  },

  /**
   * Check if running on Android
   */
  isAndroid() {
    return /Android/i.test(navigator.userAgent);
  },

  /**
   * Check if running on iOS
   */
  isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  /**
   * Get platform-specific information
   */
  getPlatformInfo() {
    return {
      isAndroid: this.isAndroid(),
      isIOS: this.isIOS(),
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol
    };
  }
};

export default BLEManager;