import {createContext,useContext,useEffect,useState} from 'react';
import api from '../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}) {
  const [user,setUser]=useState(null),[profile,setProfile]=useState(null);
  const [token,setToken]=useState(sessionStorage.getItem('token'));
  const [loading,setLoading]=useState(true),[activeRole,setActiveRole]=useState(sessionStorage.getItem('activeRole'));
  useEffect(()=>{
    // Remove sensitive caches left by older versions.
    for(const key of ['token','user','profile','activeRole']) localStorage.removeItem(key);
    let mounted=true;
    if(!sessionStorage.getItem('token')) {setLoading(false);return;}
    api.get('/auth/me').then(res=>{if(mounted){setUser(res.data.data.user);setProfile(res.data.data.profile);}})
      .catch(()=>{sessionStorage.removeItem('token');if(mounted)setToken(null);}).finally(()=>{if(mounted)setLoading(false);});
    return ()=>{mounted=false;};
  },[]);
  const selectRole=role=>{setActiveRole(role);sessionStorage.setItem('activeRole',role);};
  const saveSession=data=>{
    sessionStorage.setItem('token',data.token);setToken(data.token);setUser(data.user);setProfile(data.profile||null);selectRole(data.user.role);return data;
  };
  const login=async credentials=>saveSession((await api.post('/auth/login',credentials)).data.data);
  const adminLogin=async credentials=>saveSession((await api.post('/auth/admin/login',credentials)).data.data).user;
  const register=async data=>{const res=await api.post('/auth/register',data);if(user)saveSession(res.data.data);return res.data;};
  const logout=async()=>{
    try{await api.post('/auth/logout');}catch{/* Local sign-out remains available during an outage. */}
    sessionStorage.removeItem('token');sessionStorage.removeItem('activeRole');setToken(null);setUser(null);setProfile(null);setActiveRole(null);
  };
  const refreshUser=async()=>{const res=await api.get('/auth/me');setUser(res.data.data.user);setProfile(res.data.data.profile);};
  return <AuthContext.Provider value={{user,profile,token,loading,activeRole,selectRole,isAuthenticated:Boolean(token&&user),login,adminLogin,register,logout,setUser,setProfile,updateProfile:setProfile,refreshUser}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const context=useContext(AuthContext);if(!context)throw new Error('AuthProvider required');return context;}
