// Constants for maximum roaming ranges in meters
export const MAX_ROAMING_RANGES = {
  cat: 2000, // 2 km
  dog: 3000, // 3 km
  other: 2500, // Default range for other animals
};

/**
 * Calculate the center point of multiple coordinates
 */
export const calculateCenter = (coordinates) => {
  if (!coordinates.length) return null;

  const sumLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0);
  const sumLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0);

  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
};

/**
 * Calculate distance between two points in meters
 */
export const calculateDistance = (point1, point2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Filter sightings based on maximum roaming range
 */
export const filterSightingsWithinRange = (sightings, animalType) => {
  if (sightings.length < 3) return sightings;

  const maxRange = MAX_ROAMING_RANGES[animalType] || MAX_ROAMING_RANGES.other;
  const center = calculateCenter(sightings);

  // Filter sightings within the maximum range from the center
  const validSightings = sightings.filter(
    (sighting) => calculateDistance(center, sighting) <= maxRange
  );

  return validSightings.length >= 3 ? validSightings : sightings;
};

/**
 * Calculate the adjusted radius for the area circle
 */
export const calculateAdjustedRadius = (sightings, animalType) => {
  const center = calculateCenter(sightings);
  const maxRange = MAX_ROAMING_RANGES[animalType] || MAX_ROAMING_RANGES.other;

  // Calculate the maximum distance from center to any sighting
  const maxDistance = Math.max(
    ...sightings.map((s) => calculateDistance(center, s))
  );

  // Return the smaller of maxDistance or maxRange, with a 20% buffer
  return Math.min(maxDistance, maxRange) * 1.2;
};
