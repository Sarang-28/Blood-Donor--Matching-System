import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({iconUrl:markerIcon,iconRetinaUrl:markerRetina,shadowUrl:markerShadow});
export const mapSettings={
  tileUrl:import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  center:[Number(import.meta.env.VITE_MAP_LAT || 18.5204),Number(import.meta.env.VITE_MAP_LNG || 73.8567)],
};
export const validPoint=(lat,lng)=>lat!=='' && lng!=='' && lat!=null && lng!=null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) && Math.abs(Number(lat))<=90 && Math.abs(Number(lng))<=180;
export const directionsUrl=(lat,lng)=>`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
