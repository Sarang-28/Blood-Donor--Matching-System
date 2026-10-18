import {useEffect,useState} from 'react';
import {Box,Typography,Button,Alert,Table,TableBody,TableRow,TableCell,TableHead} from '@mui/material';
import api from '../services/api';
export default function AdminReports(){
 const [report,setReport]=useState(null),[logs,setLogs]=useState([]),[error,setError]=useState('');
 useEffect(()=>{Promise.all([api.get('/admin/reports'),api.get('/admin/audit-logs')]).then(([r,l])=>{setReport(r.data.data);setLogs(l.data.data);}).catch(()=>setError('Could not load reports.'));},[]);
 const download=async()=>{try{const r=await api.get('/admin/reports?format=csv',{responseType:'blob'});const url=URL.createObjectURL(r.data);const a=document.createElement('a');a.href=url;a.download='bloodmatch-aggregate-report.csv';a.click();URL.revokeObjectURL(url);}catch{setError('Export failed.');}};
 return <Box><Typography variant="h5">Operational reports</Typography>{error&&<Alert severity="error">{error}</Alert>}<Button onClick={download}>Export aggregate CSV</Button>
 <Table><TableHead><TableRow>{['Blood group','Urgency','Status','Requests','Units fulfilled'].map(s=><TableCell key={s}>{s}</TableCell>)}</TableRow></TableHead><TableBody>{report?.requests.map((r,i)=><TableRow key={i}>{[r.blood_group,r.urgency,r.status,r.count,r.units_fulfilled].map((v,j)=><TableCell key={j}>{v}</TableCell>)}</TableRow>)}</TableBody></Table>
 <Typography variant="h6" sx={{mt:3}}>Notification delivery</Typography>{report?.delivery.map((r,i)=><Typography key={i}>{r.channel}: {r.status} — {r.count}</Typography>)}
 <Typography variant="h6" sx={{mt:3}}>Recent audit events</Typography>{logs.map(l=><Typography key={l.id}>{new Date(l.created_at).toLocaleString()} · {l.action} · {l.target_id||'aggregate export'}</Typography>)}
 </Box>;
}
