import {useState,useEffect} from 'react';
import {Box,Typography,Button,Alert,Grid,CircularProgress,Card} from '@mui/material';
import {Link} from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TrackDonorsDialog from '../components/TrackDonorsDialog';
import api from '../services/api';
export default function PatientDashboard(){
 const [requests,setRequests]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[tracked,setTracked]=useState(null);
 const load=()=>api.get('/blood-requests/my').then(r=>{setRequests(r.data.data);setError('');}).catch(()=>setError('Could not load your requests.')).finally(()=>setLoading(false));
 useEffect(()=>{load();const timer=setInterval(load,15000);return()=>clearInterval(timer);},[]);
 const cancel=async id=>{try{await api.patch(`/blood-requests/${id}/status`,{status:'cancelled'});load();}catch(e){setError(e.response?.data?.message||'Cancellation failed.');}};
 return <Box sx={{display:'flex',minHeight:'100vh',bgcolor:'#F6F7FB'}}><Sidebar role="patient"/><Box component="main" sx={{flexGrow:1,p:4,mt:8}}>
 <Typography variant="h4">Patient portal</Typography><Button component={Link} to="/blood-requests/patient">Create a blood request</Button>
 <Alert severity="warning" sx={{my:2}}>For emergencies, contact your hospital immediately. Matching is preliminary and does not replace clinical testing.</Alert>
 {error&&<Alert severity="error">{error}</Alert>}{loading?<CircularProgress/>:<>
 <Typography sx={{mb:2}}>{requests.length} requests · {requests.filter(r=>r.status==='fulfilled').length} fulfilled · {requests.reduce((n,r)=>n+Number(r.acceptedCount),0)} accepted responses</Typography>
 <Grid container spacing={2}>{requests.map(r=><Grid size={{xs:12,md:6}} key={r.id}><Card sx={{p:3}}><Typography variant="h6">{r.bloodGroup} at {r.hospital}</Typography><Typography>{r.status} · {r.unitsFulfilled}/{r.unitsRequired} units fulfilled</Typography><Typography>{r.matchedCount} invitations · {r.acceptedCount} accepted</Typography><Button onClick={()=>setTracked(r.id)}>View matches</Button>{['active','matching'].includes(r.status)&&<Button color="error" onClick={()=>cancel(r.id)}>Cancel request</Button>}</Card></Grid>)}</Grid>
 {!requests.length&&<Typography>No requests yet.</Typography>}</>}
 <TrackDonorsDialog open={Boolean(tracked)} onClose={()=>setTracked(null)} requestId={tracked}/>
 </Box></Box>;
}
