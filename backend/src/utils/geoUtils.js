const isValidCoordinates = (lat, lng) => [lat, lng].every(v => v !== null && v !== undefined && v !== '' && ['string', 'number'].includes(typeof v) && Number.isFinite(Number(v)))
    && Number(lat) >= -90 && Number(lat) <= 90 && Number(lng) >= -180 && Number(lng) <= 180;
const resolveCoordinates = (lat, lng) => {
    if (!isValidCoordinates(lat, lng)) throw Object.assign(new Error('Select a location on the map or supply valid coordinates.'), { statusCode: 400 });
    return { latitude: Number(lat), longitude: Number(lng) };
};
module.exports = { isValidCoordinates, resolveCoordinates };
