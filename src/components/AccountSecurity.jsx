import {useState,useEffect} from 'react';
import {Card,Typography,TextField,Button,Alert,Switch,FormControlLabel} from '@mui/material';
import api from '../services/api';
import {useAuth} from '../context/AuthContext';
import {requestFirebaseNotificationPermission} from '../config/firebase';
export default function AccountSecurity(){
 const {logout}=useAuth();
 const [currentPassword,setCurrent]=useState(''),[newPassword,setNew]=useState(''),[message,setMessage]=useState(null);
 const [preferences,setPreferences]=useState(null),[busy,setBusy]=useState(false);
 useEffect(()=>{api.get('/account/preferences').then(r=>setPreferences(r.data.data)).catch(()=>setMessage({type:'error',text:'Could not load notification preferences.'}));},[]);
 const change=async()=>{setBusy(true);try{await api.post('/auth/change-password',{currentPassword,newPassword});setCurrent('');setNew('');await logout();}catch(e){setMessage({type:'error',text:e.response?.data?.message||'Password change failed.'});}finally{setBusy(false);}};
 const save=async()=>{setBusy(true);try{await api.put('/account/preferences',{smsConsent:preferences.sms_consent,pushConsent:preferences.push_consent});if(preferences.push_consent)await requestFirebaseNotificationPermission();setMessage({type:'success',text:'Preferences saved.'});}catch(e){setMessage({type:'error',text:e.response?.data?.message||'Could not save preferences.'});}finally{setBusy(false);}};
 return <Card sx={{p:3,mt:3}}><Typography variant="h6">Account security and notifications</Typography>
 {message&&<Alert severity={message.type}>{message.text}</Alert>}
 <TextField sx={{mt:2,mr:2}} label="Current password" type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrent(e.target.value)}/>
 <TextField sx={{mt:2}} label="New password" type="password" autoComplete="new-password" helperText="At least 12 characters; maximum 72 UTF-8 bytes" value={newPassword} onChange={e=>setNew(e.target.value)}/>
 <Button disabled={busy||!currentPassword||newPassword.length<12} onClick={change}>Change password and sign out</Button>
 {preferences&&<><Typography variant="body2" sx={{mt:2}}>SMS: {preferences.providers.sms?'configured':'unconfigured'} · Push: {preferences.providers.push?'configured':'unconfigured'}</Typography>
 <FormControlLabel label="Allow SMS alerts" control={<Switch checked={preferences.sms_consent} onChange={e=>setPreferences({...preferences,sms_consent:e.target.checked})}/>}/>
 <FormControlLabel label="Allow push alerts" control={<Switch checked={preferences.push_consent} onChange={e=>setPreferences({...preferences,push_consent:e.target.checked})}/>}/>
 <Button disabled={busy} onClick={save}>Save notification preferences</Button></>}
 </Card>;
}
