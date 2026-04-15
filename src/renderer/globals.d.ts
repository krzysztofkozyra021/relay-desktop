interface Window {
  dbAPI: {
    getDevices: () => Promise<any[]>
    addDevice: (
      deviceId: string,
      name: string,
      type: string,
      model: string,
      brand: string,
      serial_number: string,
      location: string,
      installation_date: string,
      notes: string
    ) => Promise<number | bigint>
  }
}
