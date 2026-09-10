/**
 * Geolocation & PostGIS Spatial Utilities
 */

const DEFAULT_COORDINATES = {
    latitude: 18.5204,  // Default: Pune, Maharashtra
    longitude: 73.8567,
};

/**
 * Validate latitude and longitude values
 */
const isValidCoordinates = (lat, lng) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    return (
        !isNaN(parsedLat) &&
        !isNaN(parsedLng) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLng >= -180 &&
        parsedLng <= 180
    );
};

/**
 * Resolve coordinates, using default fallback if not explicitly provided
 */
const resolveCoordinates = (lat, lng) => {
    if (isValidCoordinates(lat, lng)) {
        return {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
        };
    }
    return DEFAULT_COORDINATES;
};

module.exports = {
    DEFAULT_COORDINATES,
    isValidCoordinates,
    resolveCoordinates,
};
