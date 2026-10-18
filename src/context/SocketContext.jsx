import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
const SocketContext=createContext(null);
export const useSocket=()=>useContext(SocketContext);
export const SocketProvider=({children})=>{
  const {token}=useAuth();
  const [socket,setSocket]=useState(null);
  useEffect(()=>{
    if(!token || import.meta.env.VITE_ENABLE_LIVE_TRACKING !== 'true') return;
    const base=import.meta.env.VITE_SOCKET_URL || (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/api\/?$/, '');
    const connection=io(base,{auth:{token}});
    setSocket(connection);
    return ()=>{connection.disconnect();setSocket(null);};
  },[token]);
  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
