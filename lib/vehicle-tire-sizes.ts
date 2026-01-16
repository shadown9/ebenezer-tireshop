// Vehicle to Tire Size mapping database
// Format: "Make Model" -> compatible tire sizes

export interface VehicleTireSize {
  width: number
  ratio: number
  diameter: number
}

// Comprehensive vehicle to tire size mapping
export const vehicleTireSizes: Record<string, VehicleTireSize[]> = {
  // Chevrolet
  "Chevrolet Spark": [
    { width: 185, ratio: 55, diameter: 15 },
    { width: 195, ratio: 55, diameter: 15 },
  ],
  "Chevrolet Malibu": [
    { width: 215, ratio: 60, diameter: 16 },
    { width: 225, ratio: 55, diameter: 17 },
    { width: 235, ratio: 50, diameter: 18 },
  ],
  "Chevrolet Impala": [
    { width: 235, ratio: 50, diameter: 18 },
    { width: 245, ratio: 45, diameter: 19 },
  ],
  "Chevrolet Camaro": [
    { width: 245, ratio: 45, diameter: 20 },
    { width: 275, ratio: 40, diameter: 20 },
    { width: 285, ratio: 35, diameter: 20 },
  ],
  "Chevrolet Corvette": [
    { width: 245, ratio: 40, diameter: 18 },
    { width: 285, ratio: 35, diameter: 19 },
    { width: 305, ratio: 30, diameter: 20 },
  ],
  "Chevrolet Trax": [
    { width: 205, ratio: 70, diameter: 16 },
    { width: 215, ratio: 60, diameter: 17 },
  ],
  "Chevrolet Equinox": [
    { width: 225, ratio: 65, diameter: 17 },
    { width: 235, ratio: 55, diameter: 19 },
  ],
  "Chevrolet Traverse": [
    { width: 255, ratio: 65, diameter: 18 },
    { width: 255, ratio: 55, diameter: 20 },
  ],
  "Chevrolet Tahoe": [
    { width: 265, ratio: 70, diameter: 17 },
    { width: 275, ratio: 60, diameter: 20 },
  ],
  "Chevrolet Suburban": [
    { width: 265, ratio: 70, diameter: 17 },
    { width: 275, ratio: 60, diameter: 20 },
  ],
  "Chevrolet Silverado 1500": [
    { width: 265, ratio: 70, diameter: 17 },
    { width: 275, ratio: 60, diameter: 20 },
    { width: 285, ratio: 45, diameter: 22 },
  ],
  "Chevrolet Silverado 2500": [
    { width: 265, ratio: 70, diameter: 18 },
    { width: 275, ratio: 65, diameter: 20 },
  ],
  "Chevrolet Colorado": [
    { width: 255, ratio: 65, diameter: 17 },
    { width: 265, ratio: 65, diameter: 17 },
  ],
  "Chevrolet Blazer": [
    { width: 225, ratio: 65, diameter: 17 },
    { width: 235, ratio: 50, diameter: 19 },
  ],
  "Chevrolet Bolt EV": [{ width: 215, ratio: 50, diameter: 17 }],

  // Toyota
  "Toyota Corolla": [
    { width: 195, ratio: 65, diameter: 15 },
    { width: 205, ratio: 55, diameter: 16 },
    { width: 215, ratio: 45, diameter: 17 },
  ],
  "Toyota Camry": [
    { width: 205, ratio: 65, diameter: 16 },
    { width: 215, ratio: 55, diameter: 17 },
    { width: 235, ratio: 45, diameter: 18 },
  ],
  "Toyota RAV4": [
    { width: 225, ratio: 65, diameter: 17 },
    { width: 235, ratio: 55, diameter: 19 },
  ],
  "Toyota Highlander": [
    { width: 245, ratio: 60, diameter: 18 },
    { width: 235, ratio: 55, diameter: 20 },
  ],
  "Toyota Tacoma": [
    { width: 265, ratio: 70, diameter: 16 },
    { width: 265, ratio: 65, diameter: 17 },
  ],
  "Toyota Tundra": [
    { width: 275, ratio: 65, diameter: 18 },
    { width: 275, ratio: 55, diameter: 20 },
  ],
  "Toyota 4Runner": [
    { width: 265, ratio: 70, diameter: 17 },
    { width: 275, ratio: 60, diameter: 20 },
  ],

  // Honda
  "Honda Civic": [
    { width: 195, ratio: 65, diameter: 15 },
    { width: 205, ratio: 55, diameter: 16 },
    { width: 215, ratio: 50, diameter: 17 },
  ],
  "Honda Accord": [
    { width: 215, ratio: 60, diameter: 16 },
    { width: 225, ratio: 50, diameter: 17 },
    { width: 235, ratio: 45, diameter: 18 },
  ],
  "Honda CR-V": [
    { width: 225, ratio: 65, diameter: 17 },
    { width: 235, ratio: 60, diameter: 18 },
  ],
  "Honda Pilot": [
    { width: 245, ratio: 60, diameter: 18 },
    { width: 255, ratio: 50, diameter: 20 },
  ],

  // Ford
  "Ford F-150": [
    { width: 265, ratio: 70, diameter: 17 },
    { width: 275, ratio: 65, diameter: 18 },
    { width: 275, ratio: 55, diameter: 20 },
  ],
  "Ford Escape": [
    { width: 225, ratio: 65, diameter: 17 },
    { width: 235, ratio: 55, diameter: 18 },
  ],
  "Ford Explorer": [
    { width: 245, ratio: 60, diameter: 18 },
    { width: 255, ratio: 55, diameter: 20 },
  ],
  "Ford Mustang": [
    { width: 235, ratio: 50, diameter: 18 },
    { width: 255, ratio: 40, diameter: 19 },
  ],

  // Nissan
  "Nissan Altima": [
    { width: 215, ratio: 60, diameter: 16 },
    { width: 235, ratio: 45, diameter: 18 },
  ],
  "Nissan Rogue": [
    { width: 225, ratio: 65, diameter: 17 },
    { width: 225, ratio: 60, diameter: 18 },
  ],
  "Nissan Pathfinder": [
    { width: 255, ratio: 60, diameter: 18 },
    { width: 255, ratio: 55, diameter: 20 },
  ],

  // Add more vehicles as needed...
}

export function getTireSizesForVehicle(make: string, model: string): VehicleTireSize[] {
  const key = `${make} ${model}`
  return vehicleTireSizes[key] || []
}

export function isCompatibleTireSize(
  tire: { width: number; ratio: number; diameter: number },
  vehicleSizes: VehicleTireSize[],
): boolean {
  return vehicleSizes.some(
    (size) => size.width === tire.width && size.ratio === tire.ratio && size.diameter === tire.diameter,
  )
}
