const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const db = require('./db');
const env = require('./env');
const { isValidCoordinates } = require('../utils/geoUtils');
let io;
const uuid = value => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
async function authorize(socket, matchId, donorOnly = false) {
    if (!uuid(matchId) || socket.data.expires <= Date.now()) return false;
    const result = await db.query(`SELECT d.user_id AS donor_user_id FROM donor_matches dm
        JOIN donors d ON d.id=dm.donor_id JOIN blood_requests br ON br.id=dm.blood_request_id
        JOIN users u ON u.id=$2
        WHERE dm.id=$1 AND dm.match_status='accepted' AND dm.requester_decision='approved' AND br.status IN ('active','matching')
        AND (br.required_before IS NULL OR br.required_before>NOW()) AND u.is_active AND u.token_version=$3
        AND (d.user_id=$2 OR (NOT $4::boolean AND br.requester_user_id=$2))`,
        [matchId,socket.data.userId,socket.data.version,donorOnly]);
    return result.rowCount > 0;
}
const initializeSocket = server => {
    io = new Server(server, { cors: { origin: env.allowedOrigins }, maxHttpBufferSize: 4096 });
    io.use(async (socket,next) => {
        try {
            const decoded=jwt.verify(socket.handshake.auth?.token,env.jwt.secret,{algorithms:['HS256']});
            const user=await db.query('SELECT id FROM users WHERE id=$1 AND is_active AND token_version=$2',[decoded.userId,decoded.version||0]);
            if(!user.rowCount) throw new Error();
            socket.data={userId:decoded.userId,version:decoded.version||0,expires:decoded.exp*1000,lastUpdate:0};
            next();
        } catch { next(new Error('Authentication required')); }
    });
    io.on('connection',socket=>{
        socket.on('join_tracking_room',async (payload={},ack)=>{
            try {
                if(!await authorize(socket,payload.matchId)) throw new Error();
                await socket.join(`tracking_${payload.matchId}`);
                if(typeof ack==='function') ack({success:true});
            } catch { if(typeof ack==='function') ack({success:false}); }
        });
        socket.on('leave_tracking_room',(payload={})=>{if(uuid(payload.matchId)) socket.leave(`tracking_${payload.matchId}`);});
        socket.on('location_update',async (payload={})=>{
            try {
                const {matchId,latitude,longitude}=payload;
                if(Date.now()-socket.data.lastUpdate<3000) return;
                socket.data.lastUpdate=Date.now();
                if(!isValidCoordinates(latitude,longitude) || !socket.rooms.has(`tracking_${matchId}`) || !await authorize(socket,matchId,true)) return;
                const recipients=await io.in(`tracking_${matchId}`).fetchSockets();
                for(const recipient of recipients) {
                    if(recipient.id!==socket.id && await authorize(recipient,matchId)) recipient.emit('donor_location_updated',{matchId,latitude:Number(latitude),longitude:Number(longitude),timestamp:new Date().toISOString()});
                }
            } catch { /* Fail closed; never log location payloads. */ }
        });
    });
    return io;
};
const getIo=()=>{if(!io) throw new Error('Socket server unavailable'); return io;};
module.exports={initializeSocket,getIo,authorize};
