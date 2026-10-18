import {useState,useEffect} from 'react';
import {Box,Button,TextField,Typography,Alert,FormControlLabel,Checkbox} from '@mui/material';
import {MapContainer,TileLayer,Marker,useMap,useMapEvents} from 'react-leaflet';
import {mapSettings,validPoint} from '../config/maps';
function Point({value,onChange}) {
  const map=useMap();
  useMapEvents({click:e=>onChange({...value,latitude:e.latlng.lat,longitude:e.latlng.lng})});
  useEffect(()=>{if(validPoint(value.latitude,value.longitude)) map.setView([Number(value.latitude),Number(value.longitude)],13);},[value.latitude,value.longitude,map]);
  return validPoint(value.latitude,value.longitude)?<Marker position={[Number(value.latitude),Number(value.longitude)]}/>:null;
}
export default function LocationPicker({value,onChange,donor=false}) {
  const [error,setError]=useState('');
  const locate=()=>{
    if(!navigator.geolocation) {setError('Location is unavailable. Enter coordinates or choose on the map.');return;}
    navigator.geolocation.getCurrentPosition(p=>{setError('');onChange({...value,latitude:p.coords.latitude,longitude:p.coords.longitude});},()=>setError('Location permission denied. You can select a point or enter coordinates.'),{timeout:10000,maximumAge:60000});
  };
  return <Box sx={{my:2}}>
    <Typography variant="subtitle2">{donor?'Your matching location':'Hospital / destination location'}</Typography>
    <Typography variant="caption" display="block">Choose a point or enter coordinates. The map provider receives your IP address and viewed map area.</Typography>
    {error && <Alert severity="warning">{error}</Alert>}
    <Button onClick={locate}>Use my current location</Button>
    <Box sx={{display:'flex',gap:1,my:1}}>
      <TextField label="Latitude" type="number" value={value.latitude??''} onChange={e=>onChange({...value,latitude:e.target.value})} slotProps={{htmlInput:{min:-90,max:90,step:'any'}}}/>
      <TextField label="Longitude" type="number" value={value.longitude??''} onChange={e=>onChange({...value,longitude:e.target.value})} slotProps={{htmlInput:{min:-180,max:180,step:'any'}}}/>
    </Box>
    <MapContainer center={mapSettings.center} zoom={11} style={{height:240,width:'100%'}}>
      <TileLayer url={mapSettings.tileUrl} attribution={mapSettings.attribution}/><Point value={value} onChange={onChange}/>
    </MapContainer>
    {donor && <FormControlLabel control={<Checkbox checked={value.locationConsent===true} onChange={e=>onChange({...value,locationConsent:e.target.checked})}/>} label="Use my saved location for nearby matching. Exact coordinates are private; live sharing is separate."/>}
  </Box>;
}
