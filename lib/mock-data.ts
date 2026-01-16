import type { Tire, Appointment, Service, ServiceOption, CMSContent } from "./types"

export const mockTires: Tire[] = [
  {
    id: "1",
    brand: "Michelin Defender",
    width: 205,
    ratio: 55,
    diameter: 16,
    condition: "New",
    quantity: 8,
    price: 120,
    image: "/michelin-tire.jpg",
  },
  {
    id: "2",
    brand: "Michelin Defender",
    width: 215,
    ratio: 60,
    diameter: 16,
    condition: "New",
    quantity: 6,
    price: 125,
    image: "/michelin-tire.jpg",
  },
  {
    id: "3",
    brand: "Goodyear Assurance",
    width: 225,
    ratio: 65,
    diameter: 17,
    condition: "New",
    quantity: 10,
    price: 135,
    image: "/goodyear-tire.jpg",
  },
  {
    id: "4",
    brand: "Toyo",
    width: 195,
    ratio: 65,
    diameter: 15,
    condition: "Used",
    quantity: 2,
    price: 45,
    image: "/used-tire.jpg",
  },
  {
    id: "5",
    brand: "Bridgestone Turanza",
    width: 205,
    ratio: 55,
    diameter: 16,
    condition: "Used",
    quantity: 3,
    price: 55,
    image: "/used-tire.jpg",
  },
  {
    id: "6",
    brand: "Continental",
    width: 235,
    ratio: 45,
    diameter: 18,
    condition: "New",
    quantity: 12,
    price: 150,
    image: "/continental-tire.jpg",
  },
]

export const mockServices: Service[] = [
  {
    id: "mount-balance",
    name: "Mount & Balance",
    category: "tire",
    basePrice: 25,
    requiresVehicleInfo: false,
  },
  {
    id: "flat-repair",
    name: "Flat Repair",
    category: "tire",
    basePrice: 20,
    requiresVehicleInfo: false,
  },
  {
    id: "rotation",
    name: "Tire Rotation",
    category: "tire",
    basePrice: 30,
    requiresVehicleInfo: false,
  },
  {
    id: "oil-change",
    name: "Oil Change",
    category: "mechanic",
    basePrice: 45,
    requiresVehicleInfo: true,
  },
  {
    id: "brake-pads",
    name: "Brake Pads Replacement",
    category: "mechanic",
    basePrice: 150,
    requiresVehicleInfo: true,
  },
  {
    id: "disc-resurfacing",
    name: "Disc Resurfacing (Rectificación de Discos)",
    category: "specialty",
    basePrice: 80,
    requiresVehicleInfo: true,
    hasOptions: true,
  },
]

export const serviceOptions: ServiceOption[] = [
  {
    serviceId: "disc-resurfacing",
    option: "2-rotors",
    label: "2 Rotors",
    price: 80,
  },
  {
    serviceId: "disc-resurfacing",
    option: "4-rotors",
    label: "4 Rotors",
    price: 140,
  },
]

function generateTrackingNumber(): string {
  const prefix = "GP"
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export const mockAppointments: Appointment[] = [
  {
    id: "1",
    trackingNumber: generateTrackingNumber(),
    customerName: "Juan Perez",
    customerEmail: "juan.perez@example.com",
    customerPhone: "+1-555-0101",
    vehicleInfo: {
      year: 2020,
      make: "Toyota",
      model: "Corolla",
      engine: "1.8L",
    },
    services: [
      {
        serviceId: "oil-change",
        serviceName: "Oil Change",
      },
    ],
    date: new Date().toISOString().split("T")[0],
    time: "14:00",
    status: "confirmed",
    totalPrice: 45,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    trackingNumber: generateTrackingNumber(),
    customerName: "Maria Diaz",
    customerEmail: "maria.diaz@example.com",
    customerPhone: "+1-555-0102",
    vehicleInfo: {
      year: 2018,
      make: "Honda",
      model: "Civic",
    },
    services: [
      {
        serviceId: "disc-resurfacing",
        serviceName: "Disc Resurfacing (Rectificación de Discos)",
        option: "2-rotors",
      },
    ],
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "09:00",
    status: "pending",
    totalPrice: 80,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    trackingNumber: generateTrackingNumber(),
    customerName: "Carlos Rodriguez",
    customerEmail: "carlos.r@example.com",
    customerPhone: "+1-555-0103",
    services: [
      {
        serviceId: "mount-balance",
        serviceName: "Mount & Balance",
      },
    ],
    date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    time: "11:00",
    status: "pending",
    totalPrice: 25,
    createdAt: new Date().toISOString(),
  },
]

export const mockCMSContent: CMSContent[] = [
  {
    id: "1",
    type: "banner",
    title: "Summer Sale - 20% Off All New Tires!",
    description: "Limited time offer. Book your appointment today.",
    imageUrl: "/tire-shop-summer-sale-banner.jpg",
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    type: "gallery",
    title: "Our Shop",
    imageUrl: "/modern-auto-shop-interior.jpg",
    active: true,
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    type: "gallery",
    title: "Professional Equipment",
    imageUrl: "/tire-changing-machine.jpg",
    active: true,
    updatedAt: new Date().toISOString(),
  },
]

export const mockBanners = mockCMSContent.filter((item) => item.type === "banner").map(({ type, ...rest }) => rest)

export const mockGallery = mockCMSContent.filter((item) => item.type === "gallery").map(({ type, ...rest }) => rest)

// SQL Schema for reference (PostgreSQL with Drizzle ORM)
export const sqlSchema = `
-- Tires Table
CREATE TABLE tires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand VARCHAR(255) NOT NULL,
  width INTEGER NOT NULL,
  ratio INTEGER NOT NULL,
  diameter INTEGER NOT NULL,
  condition VARCHAR(10) CHECK (condition IN ('New', 'Used')),
  quantity INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE services (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) CHECK (category IN ('tire', 'mechanic', 'specialty')),
  base_price DECIMAL(10, 2) NOT NULL,
  requires_vehicle_info BOOLEAN DEFAULT FALSE,
  has_options BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service Options Table
CREATE TABLE service_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id VARCHAR(100) REFERENCES services(id),
  option_key VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Appointments Table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) NOT NULL,
  vehicle_year INTEGER,
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_engine VARCHAR(100),
  date DATE NOT NULL,
  time TIME NOT NULL,
  status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled')),
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointment Services (junction table)
CREATE TABLE appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  service_id VARCHAR(100) REFERENCES services(id),
  service_name VARCHAR(255) NOT NULL,
  option_key VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL
);

-- CMS Content Table
CREATE TABLE cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) CHECK (type IN ('banner', 'gallery')),
  title VARCHAR(255),
  description TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_tires_size ON tires(width, ratio, diameter);
CREATE INDEX idx_tires_condition ON tires(condition);
CREATE INDEX idx_tires_quantity ON tires(quantity);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_cms_content_type ON cms_content(type, active);
`

export { generateTrackingNumber }
