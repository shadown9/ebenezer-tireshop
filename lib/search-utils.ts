import type { Tire } from "./types"
import { getTireSizesForVehicle, isCompatibleTireSize } from "./vehicle-tire-sizes"

export interface TireSearchBySize {
  width?: number
  ratio?: number
  diameter?: number
  condition?: "New" | "Used"
}

export interface VehicleSearch {
  year?: number
  make?: string
  model?: string
  condition?: "New" | "Used"
}

export function searchTiresBySize(tires: Tire[], search: TireSearchBySize): Tire[] {
  const hasFilters = search.width || search.ratio || search.diameter || search.condition
  if (!hasFilters) return []

  const results = tires.filter((tire) => {
    if (search.width !== undefined && tire.width !== search.width) return false
    if (search.ratio !== undefined && tire.ratio !== search.ratio) return false
    if (search.diameter !== undefined && tire.diameter !== search.diameter) return false
    if (search.condition !== undefined && tire.condition !== search.condition) return false
    return true
  })

  return results
}

export function searchTiresByVehicle(tires: Tire[], vehicle: VehicleSearch): Tire[] {
  const hasFilters = vehicle.year || vehicle.make || vehicle.model || vehicle.condition
  if (!hasFilters) return []

  // Get compatible tire sizes for the selected vehicle
  let compatibleSizes: Array<{ width: number; ratio: number; diameter: number }> = []

  if (vehicle.make && vehicle.model) {
    compatibleSizes = getTireSizesForVehicle(vehicle.make, vehicle.model)

  }

  const results = tires.filter((tire) => {
    // Filter by condition if specified
    if (vehicle.condition !== undefined && tire.condition !== vehicle.condition) {
      return false
    }

    // If we have a specific vehicle selected (make + model), only show compatible tire sizes
    if (vehicle.make && vehicle.model && compatibleSizes.length > 0) {
      const isCompatible = isCompatibleTireSize(tire, compatibleSizes)

      return isCompatible
    }

    // If only make or condition is selected (not a complete vehicle), show all matching
    return true
  })


  return results
}

export const tireWidths = [175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335]
export const tireRatios = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
export const tireDiameters = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 28]

export const vehicleYears = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i)

export const vehicleMakes = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "Hyundai",
  "Kia",
  "Jeep",
  "Ram",
  "GMC",
  "Mazda",
  "Subaru",
  "Volkswagen",
  "Dodge",
  "Mercedes-Benz",
  "BMW",
  "Lexus",
  "Audi",
  "Tesla",
  "Buick",
  "Cadillac",
  "Chrysler",
  "Acura",
  "Infiniti",
  "Lincoln",
  "Volvo",
  "Genesis",
  "Mitsubishi",
  "Porsche",
  "Land Rover",
  "Jaguar",
  "Mini",
  "Alfa Romeo",
  "Fiat",
  "Maserati",
  "Polestar",
  "Rivian",
  "Ferrari",
  "Lamborghini",
]

export const vehicleModels: Record<string, string[]> = {
  Acura: ["ILX", "TLX", "RLX", "MDX", "RDX", "NSX", "Integra"],
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale", "4C"],
  Audi: ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "e-tron", "RS3", "RS5", "RS7", "R8"],
  BMW: [
    "2 Series",
    "3 Series",
    "4 Series",
    "5 Series",
    "7 Series",
    "X1",
    "X3",
    "X5",
    "X7",
    "iX",
    "i4",
    "M3",
    "M5",
    "Z4",
  ],
  Buick: ["Enclave", "Encore", "Encore GX", "Envision"],
  Cadillac: ["CT4", "CT5", "XT4", "XT5", "XT6", "Escalade", "Lyriq"],
  Chevrolet: [
    "Spark",
    "Malibu",
    "Impala",
    "Camaro",
    "Corvette",
    "Trax",
    "Equinox",
    "Traverse",
    "Tahoe",
    "Suburban",
    "Silverado 1500",
    "Silverado 2500",
    "Colorado",
    "Blazer",
    "Bolt EV",
  ],
  Chrysler: ["300", "Pacifica", "Voyager"],
  Dodge: ["Charger", "Challenger", "Durango", "Hornet"],
  Ferrari: ["Roma", "Portofino", "F8", "SF90", "296 GTB", "812"],
  Fiat: ["500", "500X", "500L"],
  Ford: [
    "Fiesta",
    "Focus",
    "Fusion",
    "Mustang",
    "EcoSport",
    "Escape",
    "Edge",
    "Explorer",
    "Expedition",
    "F-150",
    "F-250",
    "F-350",
    "Ranger",
    "Bronco",
    "Bronco Sport",
    "Maverick",
    "Mustang Mach-E",
  ],
  Genesis: ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  GMC: ["Terrain", "Acadia", "Yukon", "Sierra 1500", "Sierra 2500", "Canyon"],
  Honda: ["Civic", "Accord", "Insight", "CR-V", "HR-V", "Pilot", "Passport", "Ridgeline", "Odyssey"],
  Hyundai: [
    "Accent",
    "Elantra",
    "Sonata",
    "Veloster",
    "Venue",
    "Kona",
    "Tucson",
    "Santa Fe",
    "Palisade",
    "Ioniq 5",
    "Ioniq 6",
  ],
  Infiniti: ["Q50", "Q60", "QX50", "QX55", "QX60", "QX80"],
  Jaguar: ["XE", "XF", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
  Jeep: ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Wagoneer", "Grand Wagoneer"],
  Kia: [
    "Rio",
    "Forte",
    "K5",
    "Stinger",
    "Soul",
    "Seltos",
    "Sportage",
    "Sorento",
    "Telluride",
    "Carnival",
    "EV6",
    "Niro",
  ],
  Lamborghini: ["Huracan", "Aventador", "Urus"],
  "Land Rover": [
    "Defender",
    "Discovery",
    "Discovery Sport",
    "Range Rover",
    "Range Rover Sport",
    "Range Rover Velar",
    "Range Rover Evoque",
  ],
  Lexus: ["IS", "ES", "LS", "RC", "LC", "UX", "NX", "RX", "GX", "LX", "RZ"],
  Lincoln: ["Corsair", "Nautilus", "Aviator", "Navigator"],
  Maserati: ["Ghibli", "Quattroporte", "Levante", "MC20", "GranTurismo"],
  Mazda: ["Mazda3", "Mazda6", "MX-5 Miata", "CX-3", "CX-30", "CX-5", "CX-50", "CX-9", "CX-90"],
  "Mercedes-Benz": [
    "A-Class",
    "C-Class",
    "E-Class",
    "S-Class",
    "CLA",
    "CLS",
    "GLA",
    "GLB",
    "GLC",
    "GLE",
    "GLS",
    "G-Class",
    "EQB",
    "EQE",
    "EQS",
  ],
  Mini: ["Cooper", "Cooper Countryman", "Cooper Clubman"],
  Mitsubishi: ["Mirage", "Eclipse Cross", "Outlander", "Outlander Sport"],
  Nissan: [
    "Versa",
    "Sentra",
    "Altima",
    "Maxima",
    "370Z",
    "GT-R",
    "Kicks",
    "Rogue",
    "Murano",
    "Pathfinder",
    "Armada",
    "Frontier",
    "Titan",
    "Leaf",
    "Ariya",
  ],
  Polestar: ["Polestar 2", "Polestar 3"],
  Porsche: ["718 Cayman", "718 Boxster", "911", "Panamera", "Macan", "Cayenne", "Taycan"],
  Ram: ["1500", "2500", "3500", "ProMaster", "ProMaster City"],
  Rivian: ["R1T", "R1S"],
  Subaru: ["Impreza", "Legacy", "WRX", "BRZ", "Crosstrek", "Forester", "Outback", "Ascent", "Solterra"],
  Tesla: ["Model 3", "Model S", "Model X", "Model Y"],
  Toyota: [
    "Corolla",
    "Camry",
    "Avalon",
    "Prius",
    "GR86",
    "Supra",
    "C-HR",
    "RAV4",
    "Venza",
    "Highlander",
    "4Runner",
    "Sequoia",
    "Land Cruiser",
    "Tacoma",
    "Tundra",
    "Sienna",
    "bZ4X",
  ],
  Volkswagen: ["Jetta", "Passat", "Arteon", "Golf", "GTI", "Taos", "Tiguan", "Atlas", "Atlas Cross Sport", "ID.4"],
  Volvo: ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90", "C40"],
}

export function getModelsForMake(make: string): string[] {
  return vehicleModels[make] || []
}
