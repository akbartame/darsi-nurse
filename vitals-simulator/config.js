module.exports = {
  mqtt: {
    host: 'mqtt://103.106.72.181',
    port: 1883,
    username: 'MEDLOC',
    password: 'MEDLOC'
  },

  intervalMs: 2000,

  rooms: [
    {
      roomId: 'RUANGAN_DUMMY1',
      deviceId: 'DUM1',
      baseHr: 72,
      baseRr: 18
    },
    {
      roomId: 'RUANGAN_DUMMY2',
      deviceId: 'DUM2',
      baseHr: 78,
      baseRr: 20
    },
    {
      roomId: 'RUANGAN_DUMMY3',
      deviceId: 'DUM3',
      baseHr: 80,
      baseRr: 22
    },
    {
        roomId: 'Rpameran',
        deviceId: 'Dpameran',
        baseHr: 75,
        baseRr: 19
    }
  ],

  fallChancePerMinute: 0 // 2% chance
};
