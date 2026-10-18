import {useState,useEffect} from 'react';
import {Card,Typography,TextField,Button,Alert} from '@mui/material';
import api from '../services/api';
export default function AdminSettings(){
 const [settings,setSettings]=useState(null),[message,setMessage]=useState('');
 useEffect(()=>{api.get('/settings').then(r=>setSettings(r.data.data)).catch(()=>setMessage('Could not load settings.'));},[]);
 const save=async()=>{try{await api.put('/settings',settings);setMessage('Settings saved and audited.');}catch(e){setMessage(e.response?.data?.message||'Save failed.');}};
 return <Card sx={{p:3}}><Typography variant="h5">Matching settings</Typography><Alert severity="info">Donation intervals are preliminary screening rules. Changes require your institution’s clinical policy.</Alert>{message&&<Typography>{message}</Typography>}{settings&&<><TextField sx={{my:2,mr:2}} label="Search radius (km)" type="number" value={settings.radiusKm} onChange={e=>setSettings({...settings,radiusKm:Number(e.target.value)})}/><TextField sx={{my:2}} label="Donation interval (days)" type="number" value={settings.cooldownDays} onChange={e=>setSettings({...settings,cooldownDays:Number(e.target.value)})}/><Button onClick={save}>Save settings</Button></>}</Card>;
}
