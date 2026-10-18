import {useState,useEffect} from 'react';
import {Box,Typography,Alert,Card,Button,TextField} from '@mui/material';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
export default function NgoDashboard(){
 const [profile,setProfile]=useState(null),[requests,setRequests]=useState([]),[message,setMessage]=useState('');
 useEffect(()=>{Promise.all([api.get('/ngos/profile'),api.get('/ngos/assignments')]).then(([p,r])=>{setProfile(p.data.data);setRequests(r.data.data);}).catch(()=>setMessage('Could not load NGO portal.'));},[]);
 const save=async()=>{try{await api.put('/ngos/profile',{ngoName:profile.ngo_name,address:profile.address,serviceArea:profile.service_area,coordinatorName:profile.coordinator_name});setMessage('Profile saved.');}catch(e){setMessage(e.response?.data?.message||'Save failed.');}};
 return <Box sx={{display:'flex',minHeight:'100vh'}}><Sidebar role="ngo"/><Box component="main" sx={{p:4,mt:8,flexGrow:1}}><Typography variant="h4">NGO coordination</Typography>{message&&<Alert severity="info">{message}</Alert>}{profile&&<Card sx={{p:3,my:2}}><Typography>Verification: {profile.verification_status}</Typography>{[['ngo_name','Organization name'],['address','Address'],['service_area','Service area'],['coordinator_name','Coordinator']].map(([key,label])=><TextField key={key} sx={{my:1}} fullWidth label={label} value={profile[key]||''} onChange={e=>setProfile({...profile,[key]:e.target.value})}/>)}<Button onClick={save}>Save profile</Button></Card>}<Typography variant="h6">Assigned requests ({requests.length})</Typography>{requests.map(r=><Card key={r.id} sx={{p:2,my:2}}><Typography>{r.blood_group} · {r.hospital_name} · {r.urgency}</Typography><Typography>{r.status} · {r.units_fulfilled}/{r.units_required} units · {r.accepted_count} accepted responses</Typography></Card>)}{!requests.length&&<Typography>No assigned requests. Request owners or administrators can assign verified NGOs.</Typography>}</Box></Box>;
}
