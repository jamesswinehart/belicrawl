/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Normalize distance for scoring (closer is better)
 */
export function normalizeDistance(distanceMeters: number): number {
  return Math.exp(-distanceMeters / 1000);
}

/**
 * Bookmark boost for scoring
 */
export function bookmarkBoost(isBookmarked: boolean): number {
  return isBookmarked ? 1 : 0;
}

/**
 * Compute trip score for restaurant ranking
 */
export function computeTripScore(
  distanceMeters: number,
  beliScore: number,
  isBookmarked: boolean
): number {
  return (
    0.5 * normalizeDistance(distanceMeters) + // location proximity
    0.3 * (beliScore / 10) + // restaurant quality
    0.2 * bookmarkBoost(isBookmarked) // personal relevance
  );
}

/**
 * Build Google Maps walking directions URL using restaurant names and cities
 * @param stops Array of restaurants in route order
 * @returns Google Maps directions URL
 */
export function buildGoogleMapsWalkingUrl(stops: Array<{ name: string; city: string }>): string {
  if (stops.length === 0) {
    return '';
  }

  if (stops.length === 1) {
    // Single destination: use My Location as origin
    const stop = stops[0];
    const destination = encodeURIComponent(`${stop.name}, ${stop.city}`);
    return `https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=${destination}`;
  }

  // Multiple stops: first is origin, last is destination, middle are waypoints
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1);

  const originQuery = encodeURIComponent(`${origin.name}, ${origin.city}`);
  const destinationQuery = encodeURIComponent(`${destination.name}, ${destination.city}`);

  let url = `https://www.google.com/maps/dir/?api=1&travelmode=walking&origin=${originQuery}&destination=${destinationQuery}`;

  if (waypoints.length > 0) {
    const waypointsStr = waypoints.map(wp => encodeURIComponent(`${wp.name}, ${wp.city}`)).join('|');
    url += `&waypoints=${waypointsStr}`;
  }

  return url;
}

