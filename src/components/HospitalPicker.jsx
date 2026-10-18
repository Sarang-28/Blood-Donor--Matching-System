import {useEffect,useState} from 'react';
import {TextField,MenuItem,Alert} from '@mui/material';
import api from '../services/api';
export default function HospitalPicker({value,onChange}){
 const [hospitals,setHospitals]=useState([]),[error,setError]=useState('');
 useEffect(()=>{api.get('/hospitals').then(r=>setHospitals(r.data.data)).catch(()=>setError('Hospital directory unavailable.'));},[]);
 return <>{error&&<Alert severity="warning">{error}</Alert>}<TextField select fullWidth sx={{my:2}} label="Assign a verified hospital" value={value.hospitalId||''} helperText="The selected hospital can view this request and verify donations." onChange={e=>{const h=hospitals.find(x=>x.id===e.target.value);onChange({...value,hospitalId:e.target.value,...(h?{hospitalName:h.hospital_name,locationName:h.address,latitude:h.latitude,longitude:h.longitude}:{})});}}><MenuItem value="">No hospital assigned yet</MenuItem>{hospitals.map(h=><MenuItem key={h.id} value={h.id}>{h.hospital_name} — {h.address}</MenuItem>)}</TextField></>;
}
