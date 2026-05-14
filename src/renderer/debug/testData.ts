export const TEST_USER = {
  email: 'test@relay.app',
  password: 'test1234',
}

export const TEST_DEVICE_DEFAULTS = {
  name: 'Klimatyzator Testowy',
  type: 'HVAC',
  brand: 'Daikin',
  model: 'FTXM35R',
  serial_number: 'DK-2024-TEST',
  location: 'Serwerownia A, piętro 2',
  installation_date: new Date().toISOString().slice(0, 10),
  notes: 'Urządzenie testowe — wygenerowane automatycznie.',
}

const SEED_DEVICES = [
  {
    name: 'Klimatyzator A1',
    type: 'HVAC',
    brand: 'Daikin',
    model: 'FTXM35R',
    serial_number: 'DK-001',
    location: 'Serwerownia A',
    notes: 'Przegląd co 6 miesięcy.',
  },
  {
    name: 'UPS Serwerownia',
    type: 'UPS',
    brand: 'APC',
    model: 'Smart-UPS 1500',
    serial_number: 'APC-002',
    location: 'Serwerownia A',
    notes: 'Test akumulatora co rok.',
  },
  {
    name: 'Switch Core L1',
    type: 'Networking',
    brand: 'Cisco',
    model: 'Catalyst 9300',
    serial_number: 'CSC-003',
    location: 'Szafa rack 1',
    notes: '',
  },
  {
    name: 'Drukarka HP 1',
    type: 'Printer',
    brand: 'HP',
    model: 'LaserJet Pro M404',
    serial_number: 'HP-004',
    location: 'Open Space, piętro 2',
    notes: 'Wymiana tonera co kwartał.',
  },
  {
    name: 'Projektor Sala Konf.',
    type: 'AV',
    brand: 'Epson',
    model: 'EB-2247U',
    serial_number: 'EP-005',
    location: 'Sala konferencyjna 1',
    notes: '',
  },
]

export async function seedTestDevices(): Promise<void> {
  const today = new Date().toISOString()
  for (const dev of SEED_DEVICES) {
    const uuid = crypto.randomUUID()
    await window.dbAPI.addDevice(
      uuid,
      dev.name,
      dev.type,
      dev.model,
      dev.brand,
      dev.serial_number,
      dev.location,
      today,
      dev.notes
    )
  }
}
